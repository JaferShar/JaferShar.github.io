import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import URDFLoader, { type URDFRobot } from 'urdf-loader'
import { useStore, type Request } from '../store'
import { createRobotRoot } from './setup'
import { getJoints, readTcp, setJoints, solveIK, solveIKRobust, TCP_LINK, type JointMap } from './ik'
import { HOME, planOpen, planReturn, WRIST_ROLL, type Step } from './motion'
import { BLOCK_SIZE, PORTAL, slotOf } from '../scene/layout'
import { cursor } from './cursor'
import type { PageId } from '../content'
import { applyCloudMix, buildPointCloud, cloudUniforms, type PointCloud } from './pointCloud'

const URDF_URL = `${import.meta.env.BASE_URL}so101/so101_new_calib.urdf`

const _axis = new THREE.Vector3()
/** Maximale Drehgeschwindigkeit der Basis beim Folgen (rad/s) */
const MAX_TURN_SPEED = 3.5

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

interface Runner {
  steps: Step[]
  i: number
  t: number
  from: JointMap | null
}

/** Legt einen Block (wieder) auf den Tisch an eine Position. */
function placeBlock(block: THREE.Object3D, pos: THREE.Vector3) {
  const home = block.userData.homeParent as THREE.Object3D
  home.attach(block)
  block.position.set(pos.x, BLOCK_SIZE / 2, pos.z)
  block.rotation.set(0, Math.atan2(pos.x, pos.z), 0)
}

export function Robot() {
  const container = useMemo(() => new THREE.Group(), [])
  const runner = useRef<Runner | null>(null)
  const cloud = useRef<PointCloud | null>(null)
  const cloudMix = useRef(0)
  const followTarget = useRef(new THREE.Vector3())
  /** Geglättetes Ziel in Polarkoordinaten um die Drehachse – so schwenkt der Greifer
   *  UM die Basis herum, statt auf gerader Linie durch den eigenen Körper zu fahren. */
  const polar = useRef({ angle: 0, radius: 0.15, y: 0.085 })
  const following = useRef(false)
  /** Letzte gute IK-Lösung – Startwert für den nächsten Frame */
  const lastSolution = useRef<JointMap | null>(null)

  // ---------- URDF laden ----------
  useEffect(() => {
    let cancelled = false
    let robot: URDFRobot | null = null
    const loader = new URDFLoader()

    // Mesh-Ladevorgänge selbst zählen. Ein LoadingManager reicht nicht: three.js' FileLoader
    // dedupliziert gleiche URLs global – im StrictMode-Doppel-Mount bekommt der zweite Manager
    // die STL-Requests nie zu sehen und meldet "fertig", bevor die Meshes da sind.
    let pending = 0
    let parsed = false
    const loadMesh = loader.loadMeshCb
    loader.loadMeshCb = (path, manager, material, done) => {
      pending++
      loadMesh(path, manager, material, (obj, err) => {
        done(obj, err)
        pending--
        finish()
      })
    }

    loader.load(URDF_URL, (r) => {
      if (cancelled) return
      robot = r
      parsed = true
      container.add(createRobotRoot(r))
      setJoints(r, HOME)
      useStore.getState().setRobot(r)
      finish()
    })

    function finish() {
      if (cancelled || !parsed || pending > 0 || !robot) return
      // Schönere Materialien + Schatten für alle Meshes
      robot.traverse((o) => {
        const m = o as THREE.Mesh
        if (!m.isMesh) return
        const old = m.material as THREE.MeshPhongMaterial
        const isServo = old.color.getHSL({ h: 0, s: 0, l: 0 }).l < 0.3
        m.material = new THREE.MeshStandardMaterial({
          color: isServo ? '#1b1b1d' : '#f2c21b',
          roughness: isServo ? 0.45 : 0.6,
          metalness: isServo ? 0.3 : 0.05,
        })
        m.castShadow = true
        m.receiveShadow = true
        m.userData.isServo = isServo
      })
      cloud.current = buildPointCloud(robot, (m) => (m.userData.isServo ? '#8f96a8' : '#ffd21f'))
      cloudMix.current = -1 // erzwingt einmaliges Anwenden im ersten Frame
      useStore.getState().setLoaded()
    }

    return () => {
      cancelled = true
      cloud.current?.dispose()
      cloud.current = null
      container.clear()
    }
  }, [container])

  // ---------- Aufträge abarbeiten ----------
  function start(robot: URDFRobot, req: Request) {
    const store = useStore.getState()
    const { docked, blocks } = store
    useStore.setState({ request: null })

    if (req.type === 'close' && !docked) return
    if (req.type === 'open' && docked === req.page) {
      useStore.setState({ activePage: req.page })
      return
    }

    useStore.setState({ busy: true, activePage: null })

    // Sofort-Modus: keine Animation, Blöcke direkt umsetzen
    if (req.instant) {
      if (docked && blocks[docked]) placeBlock(blocks[docked]!, slotOf(docked).position)
      setJoints(robot, HOME)
      if (req.type === 'open' && blocks[req.page]) {
        placeBlock(blocks[req.page]!, PORTAL.position)
        useStore.setState({ busy: false, docked: req.page, activePage: req.page })
      } else {
        useStore.setState({ busy: false, docked: null })
      }
      return
    }

    const steps: Step[] = []
    if (docked) {
      steps.push(...planReturn(robot, getJoints(robot), docked, () => useStore.setState({ docked: null })))
    }
    if (req.type === 'open') {
      const page = req.page
      const startPose = docked ? HOME : getJoints(robot)
      steps.push(...planOpen(robot, startPose, page, () => useStore.setState({ docked: page, activePage: page })))
    }
    steps.push({ kind: 'call', fn: () => useStore.setState({ busy: false }) })
    runner.current = { steps, i: 0, t: 0, from: null }
  }

  function exec(robot: URDFRobot, step: Step) {
    const blocks = useStore.getState().blocks
    if (step.kind === 'attach') {
      const b = blocks[step.page as PageId]
      if (b) robot.links[TCP_LINK].attach(b)
    } else if (step.kind === 'release') {
      const b = blocks[step.page as PageId]
      if (b) placeBlock(b, step.at)
    } else if (step.kind === 'call') {
      step.fn()
    }
  }

  const reduceMotion = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, [])

  /**
   * Leerlauf: Greifer folgt dem Cursor (Ziel kommt aus CursorControl).
   * Ohne Cursor über der Szene fährt der Arm sanft in die Ruhepose.
   */
  function follow(robot: URDFRobot, delta: number) {
    let goal: JointMap
    if (cursor.active) {
      const axis = robot.joints.shoulder_pan.getWorldPosition(_axis)
      const P = polar.current
      if (!following.current) {
        const tcp = readTcp(robot).pos
        P.angle = Math.atan2(tcp.x - axis.x, tcp.z - axis.z)
        P.radius = Math.hypot(tcp.x - axis.x, tcp.z - axis.z)
        P.y = tcp.y
        lastSolution.current = null
        following.current = true
      }

      // Glätten in Polarkoordinaten; Winkel zusätzlich in der Geschwindigkeit begrenzt.
      // Der Winkel ist auf ±105° geklemmt (hinten unerreichbar) – Übergänge laufen daher immer vorne herum.
      const c = cursor.target
      const k = 1 - Math.exp(-delta * 10)
      const goalAngle = Math.atan2(c.x - axis.x, c.z - axis.z)
      const maxStep = MAX_TURN_SPEED * delta
      P.angle += THREE.MathUtils.clamp((goalAngle - P.angle) * k, -maxStep, maxStep)
      P.radius += (Math.hypot(c.x - axis.x, c.z - axis.z) - P.radius) * k
      P.y += (c.y - P.y) * k
      const t = followTarget.current.set(axis.x + Math.sin(P.angle) * P.radius, P.y, axis.z + Math.cos(P.angle) * P.radius)

      // Drehung direkt aus dem Winkel – der Rest per IK.
      // Startwert = letzte gute Lösung, damit der Arm nicht zwischen Konfigurationen springt.
      const pan = -P.angle
      const seed = { ...(lastSolution.current ?? HOME), shoulder_pan: pan }
      let res = solveIK(robot, t, undefined, seed, 20)
      if (res.error > 0.004) {
        const alt = solveIKRobust(robot, t, seed)
        if (alt.error < res.error) res = alt
      }
      if (res.error < 0.01) lastSolution.current = res.joints
      goal = { ...(lastSolution.current ?? res.joints), wrist_roll: WRIST_ROLL, gripper: cursor.grip }
    } else {
      following.current = false
      goal = HOME
    }
    const k = 1 - Math.exp(-delta * 9)
    for (const [name, v] of Object.entries(goal)) {
      const j = robot.joints[name]
      const cur = Number(j.angle)
      if (Math.abs(v - cur) > 1e-5) j.setJointValue(cur + (v - cur) * k)
    }
  }

  useFrame(({ gl, clock }, delta) => {
    const s = useStore.getState()
    const robot = s.robot
    if (!robot || !s.loaded) return

    // ---------- Solide <-> Punktwolke überblenden ----------
    if (cloud.current) {
      const target = s.pointCloud ? 1 : 0
      const prev = cloudMix.current
      const cur = Math.max(prev, 0)
      const next = reduceMotion ? target : cur + Math.sign(target - cur) * Math.min(Math.abs(target - cur), delta / 1.4)
      if (next !== prev) {
        cloudMix.current = next
        applyCloudMix(cloud.current, next)
      }
      cloudUniforms.uMix.value = next
      cloudUniforms.uTime.value = clock.elapsedTime
      cloudUniforms.uDpr.value = gl.getPixelRatio()
      cloudUniforms.uDrift.value = reduceMotion ? 0 : 1
    }
    if (!runner.current && s.request) start(robot, s.request)

    const r = runner.current
    if (!r) {
      follow(robot, delta)
      return
    }
    following.current = false
    let dt = Math.min(delta, 0.05)
    while (r.i < r.steps.length) {
      const step = r.steps[r.i]
      if (step.kind !== 'move') {
        exec(robot, step)
        r.i++
        continue
      }
      if (!r.from) {
        r.from = getJoints(robot)
        r.t = 0
      }
      r.t += dt
      dt = 0
      const k = Math.min(1, r.t / step.duration)
      const e = ease(k)
      for (const [name, to] of Object.entries(step.to)) {
        const from = r.from[name] ?? to
        robot.joints[name].setJointValue(from + (to - from) * e)
      }
      if (k < 1) return
      r.from = null
      r.i++
    }
    runner.current = null
  })

  return <primitive object={container} />
}

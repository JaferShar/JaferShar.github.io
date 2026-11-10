import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import URDFLoader, { type URDFRobot } from 'urdf-loader'
import { useStore, type Request } from '../store'
import { createRobotRoot } from './setup'
import { getJoints, setJoints, TCP_LINK, type JointMap } from './ik'
import { HOME, planOpen, planReturn, type Step } from './motion'
import { BLOCK_SIZE, PORTAL, slotOf } from '../scene/layout'
import type { PageId } from '../content'

const URDF_URL = `${import.meta.env.BASE_URL}so101/so101_new_calib.urdf`

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

  // ---------- URDF laden ----------
  useEffect(() => {
    let cancelled = false
    let robot: URDFRobot | null = null
    const manager = new THREE.LoadingManager()
    const loader = new URDFLoader(manager)

    loader.load(URDF_URL, (r) => {
      if (cancelled) return
      robot = r
      container.add(createRobotRoot(r))
      setJoints(r, HOME)
      useStore.getState().setRobot(r)
    })

    manager.onLoad = () => {
      if (cancelled || !robot) return
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
      })
      useStore.getState().setLoaded()
    }

    return () => {
      cancelled = true
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

  useFrame((_, delta) => {
    const s = useStore.getState()
    const robot = s.robot
    if (!robot || !s.loaded) return
    if (!runner.current && s.request) start(robot, s.request)

    const r = runner.current
    if (!r) {
      // Leerlauf: Roboter "schaut" zum Block unter der Maus
      const hovered = s.hovered && s.hovered !== s.docked ? slotOf(s.hovered) : null
      const target = hovered ? -THREE.MathUtils.degToRad(hovered.angle) * 0.45 : HOME.shoulder_pan
      const pan = robot.joints.shoulder_pan
      const cur = Number(pan.angle)
      if (Math.abs(target - cur) > 1e-4) pan.setJointValue(cur + (target - cur) * Math.min(1, delta * 4))
      return
    }
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

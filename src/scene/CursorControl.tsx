import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { PAGES, type PageId } from '../content'
import { useStore } from '../store'
import { navigate } from '../navigation'
import { cursor } from '../robot/cursor'
import { GRIPPER_OPEN, HOME } from '../robot/motion'
import { BLOCK_SIZE, HOVER_HEIGHT } from './layout'

/** Erreichbarer Ring um die Drehachse (shoulder_pan) in Metern */
/** Näher an der Basis müsste sich der Arm in den eigenen Körper falten */
const MIN_REACH = 0.12
const MAX_REACH = 0.235
const MAX_ANGLE = THREE.MathUtils.degToRad(105)
/** Direkt über der Basis ist die Richtung unbestimmt – dort letzten Winkel beibehalten */
const DEADZONE = 0.05
let lastAngle = 0
/** Ab diesem Abstand (auf dem Tisch) "rastet" der Greifer über einem Block ein */
const PICK_RADIUS = 0.04
/** Wie stark der Greifer zum Block gezogen wird (0 = gar nicht, 1 = genau darüber) */
const SNAP = 0.75
/** Greifer senkt sich über einem Block etwas ab – "bereit zum Zugreifen" */
const READY_HEIGHT = 0.065
/** Maximale Mausbewegung (px), damit ein Klick als Klick zählt und nicht als Kamera-Drag */
const CLICK_SLOP = 6

const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const raycaster = new THREE.Raycaster()
const _ndc = new THREE.Vector2()
const _floor = new THREE.Vector3()
const _block = new THREE.Vector3()
const _axis = new THREE.Vector3()

/**
 * Maussteuerung: Der Greifer folgt dem Punkt auf dem Tisch unter dem Cursor.
 * In der Nähe eines Blocks rastet er ein; ein Klick startet die feste Pick-&-Place-Animation.
 */
export function CursorControl() {
  const { camera, gl } = useThree()
  const ndc = useRef(new THREE.Vector2())
  const reticle = useRef<THREE.Group>(null)
  const reticleMat = useRef<THREE.MeshBasicMaterial>(null)

  // ---------- DOM-Events ----------
  useEffect(() => {
    const el = gl.domElement
    const down = { x: 0, y: 0 }

    const toNdc = (e: PointerEvent, out: THREE.Vector2) => {
      const r = el.getBoundingClientRect()
      return out.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    }
    const onMove = (e: PointerEvent) => {
      toNdc(e, ndc.current)
      // Touch-Wischen dreht die Kamera – nur Maus/Stift steuern den Arm
      if (e.pointerType !== 'touch') cursor.active = true
    }
    const onLeave = () => {
      cursor.active = false
    }
    const onDown = (e: PointerEvent) => {
      down.x = e.clientX
      down.y = e.clientY
      toNdc(e, ndc.current)
    }
    const onUp = (e: PointerEvent) => {
      if (e.button !== 0) return
      if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > CLICK_SLOP) return // war ein Drag
      const s = useStore.getState()
      if (s.busy || !s.loaded) return
      // Position des Klicks selbst auswerten – funktioniert so auch per Touch (ohne Hover)
      if (!floorAt(camera, toNdc(e, _ndc), _floor)) return
      const hit = nearestBlock(_floor)
      if (!hit) return
      navigate(hit.page === s.docked ? null : hit.page)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('pointerup', onUp)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('pointerup', onUp)
      cursor.active = false
    }
  }, [gl, camera])

  // ---------- Pro Frame: Zielpunkt + Hover bestimmen ----------
  useFrame(() => {
    const s = useStore.getState()
    const enabled = cursor.active && s.loaded && !s.busy && !!s.robot
    const floor = enabled ? floorAt(camera, ndc.current, _floor) : null

    let hovered: PageId | null = null
    if (floor) {
      // In den erreichbaren Bereich klemmen (Polarkoordinaten um die Drehachse des Arms)
      const a = s.robot!.joints.shoulder_pan.getWorldPosition(_axis)
      const dx = floor.x - a.x
      const dz = floor.z - a.z
      if (Math.hypot(dx, dz) > DEADZONE) lastAngle = THREE.MathUtils.clamp(Math.atan2(dx, dz), -MAX_ANGLE, MAX_ANGLE)
      const angle = lastAngle
      const radius = THREE.MathUtils.clamp(Math.hypot(dx, dz), MIN_REACH, MAX_REACH)
      const t = cursor.target.set(a.x + Math.sin(angle) * radius, HOVER_HEIGHT, a.z + Math.cos(angle) * radius)

      const hit = nearestBlock(floor)
      if (hit) {
        hovered = hit.page
        t.x += (hit.pos.x - t.x) * SNAP
        t.z += (hit.pos.z - t.z) * SNAP
        t.y = READY_HEIGHT
      }
      cursor.grip = hit ? GRIPPER_OPEN : HOME.gripper
    }

    if (s.hovered !== hovered) s.setHovered(hovered)
    document.body.style.cursor = hovered ? 'pointer' : ''

    // Fadenkreuz auf dem Tisch unter dem Greiferziel
    const g = reticle.current
    if (g) {
      g.visible = !!floor
      g.position.set(cursor.target.x, 0.0008, cursor.target.z)
      const color = hovered ? PAGES.find((p) => p.id === hovered)!.color : '#e8e8e8'
      reticleMat.current?.color.set(color)
    }
  })

  return (
    <group ref={reticle} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BLOCK_SIZE * 0.32, BLOCK_SIZE * 0.4, 32]} />
        <meshBasicMaterial ref={reticleMat} transparent opacity={0.8} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Punkt auf dem Tisch unter einer Bildschirmposition (NDC) */
function floorAt(camera: THREE.Camera, p: THREE.Vector2, out: THREE.Vector3) {
  raycaster.setFromCamera(p, camera)
  return raycaster.ray.intersectPlane(floorPlane, out)
}

/** Nächster greifbarer Block in der Nähe eines Tischpunkts */
function nearestBlock(p: THREE.Vector3): { page: PageId; pos: THREE.Vector3 } | null {
  const { blocks, robot } = useStore.getState()
  let best: PageId | null = null
  let bestD = PICK_RADIUS
  for (const page of Object.keys(blocks) as PageId[]) {
    const b = blocks[page]!
    if (robot && isDescendant(b, robot)) continue // hängt gerade am Greifer
    b.getWorldPosition(_block)
    const d = Math.hypot(_block.x - p.x, _block.z - p.z)
    if (d < bestD) {
      bestD = d
      best = page
    }
  }
  if (!best) return null
  blocks[best]!.getWorldPosition(_block)
  return { page: best, pos: _block }
}

function isDescendant(obj: THREE.Object3D, ancestor: THREE.Object3D) {
  for (let o: THREE.Object3D | null = obj.parent; o; o = o.parent) if (o === ancestor) return true
  return false
}

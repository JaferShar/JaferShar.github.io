import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'

export const CAMERA_TARGET = new THREE.Vector3(0, 0.09, 0.07)

/**
 * - Auf schmalen Bildschirmen (Handy) die Kamera weiter zurücksetzen.
 * - Wenn das Seiten-Panel offen ist, das Bild sanft zur Seite schieben,
 *   damit Roboter und Drop-Zone sichtbar bleiben.
 */
export function CameraRig() {
  const { camera, size } = useThree()
  const offset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    cam.fov = aspect < 1 ? 50 : 32
    const dist = aspect < 1 ? Math.min(1.25, Math.max(0.95, 0.6 / aspect)) : 0.95
    const dir = new THREE.Vector3(0.38, 0.72, 1).normalize()
    cam.position.copy(CAMERA_TARGET).addScaledVector(dir, dist)
    cam.updateProjectionMatrix()
  }, [camera, size])

  useFrame((_, delta) => {
    const cam = camera as THREE.PerspectiveCamera
    const open = useStore.getState().activePage !== null
    const mobile = size.width <= 720
    const panel = Math.min(480, size.width - 40) + 20
    const want = open ? (mobile ? { x: 0, y: size.height * 0.28 } : { x: panel / 2, y: 0 }) : { x: 0, y: 0 }
    const k = Math.min(1, delta * 5)
    offset.current.x += (want.x - offset.current.x) * k
    offset.current.y += (want.y - offset.current.y) * k
    if (Math.abs(offset.current.x) < 0.5 && Math.abs(offset.current.y) < 0.5 && !open) {
      if (cam.view) cam.clearViewOffset()
      return
    }
    cam.setViewOffset(size.width, size.height, offset.current.x, offset.current.y, size.width, size.height)
  })
  return null
}

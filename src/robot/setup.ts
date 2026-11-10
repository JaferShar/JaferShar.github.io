import * as THREE from 'three'
import type { URDFRobot } from 'urdf-loader'

/**
 * URDF ist Z-up, three.js ist Y-up. Außerdem schaut der SO-101 bei shoulder_pan = 0
 * entlang seiner X-Achse – wir drehen ihn so, dass er zur Kamera (+Z) schaut.
 */
export function createRobotRoot(robot: URDFRobot) {
  const yaw = new THREE.Group()
  yaw.name = 'robot-root'
  yaw.rotation.y = -Math.PI / 2
  const zUp = new THREE.Group()
  zUp.rotation.x = -Math.PI / 2
  zUp.add(robot)
  yaw.add(zUp)
  return yaw
}

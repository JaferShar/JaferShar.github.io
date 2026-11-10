import * as THREE from 'three'
import { PAGES, type PageId } from '../content'

/**
 * Alle Maße in Metern – der SO-101 ist ein kleiner Tischroboter (Reichweite ~25 cm).
 * Der Roboter steht im Ursprung und schaut in Richtung +Z (zur Kamera).
 */

export const BLOCK_SIZE = 0.034
/** Höhe des Tool Center Points beim Greifen (etwas unter der Block-Oberkante) */
export const GRIP_HEIGHT = BLOCK_SIZE * 0.55
/** Höhe, auf der der Greifer über einem Block schwebt */
export const HOVER_HEIGHT = 0.085
/** Radius, auf dem Blöcke und Drop-Zone liegen */
export const RING_RADIUS = 0.2

/** Winkel (Grad) vom Roboter aus gesehen, 0 = geradeaus zur Kamera */
const SLOT_ANGLES = [-75, -42, 42, 75]
const PORTAL_ANGLE = 0

export function polar(angleDeg: number, r = RING_RADIUS, y = 0) {
  const a = THREE.MathUtils.degToRad(angleDeg)
  return new THREE.Vector3(Math.sin(a) * r, y, Math.cos(a) * r)
}

export interface Slot {
  page: PageId
  angle: number
  position: THREE.Vector3 // Mittelpunkt auf dem Tisch (y = 0)
}

export const SLOTS: Slot[] = PAGES.map((p, i) => ({
  page: p.id,
  angle: SLOT_ANGLES[i % SLOT_ANGLES.length],
  position: polar(SLOT_ANGLES[i % SLOT_ANGLES.length]),
}))

export const PORTAL = { angle: PORTAL_ANGLE, position: polar(PORTAL_ANGLE) }

export function slotOf(page: PageId) {
  return SLOTS.find((s) => s.page === page)!
}

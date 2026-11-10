import * as THREE from 'three'
import { HOVER_HEIGHT } from '../scene/layout'
import { HOME } from './motion'

/**
 * Gemeinsamer, veränderlicher Zustand für die Maussteuerung.
 * Bewusst NICHT im Zustand-Store: ändert sich jeden Frame und soll kein React-Rendering auslösen.
 * Geschrieben von CursorControl (Szene), gelesen von Robot (Gelenke).
 */
export const cursor = {
  /** Maus ist über der 3D-Szene und der Roboter darf folgen */
  active: false,
  /** Zielpunkt für den Greifer (Weltkoordinaten) */
  target: new THREE.Vector3(0, HOVER_HEIGHT, 0.15),
  /** Gewünschte Greiferöffnung */
  grip: HOME.gripper,
}

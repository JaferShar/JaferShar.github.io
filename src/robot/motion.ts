import * as THREE from 'three'
import type { URDFRobot } from 'urdf-loader'
import { solveIKRobust, type JointMap } from './ik'
import { GRIP_HEIGHT, HOVER_HEIGHT, PORTAL, slotOf } from '../scene/layout'
import type { PageId } from '../content'

/**
 * Eine Bewegung besteht aus einer Liste von Schritten, die nacheinander abgespielt werden.
 * Alle IK-Lösungen werden VOR der Bewegung berechnet – beim Abspielen wird nur noch
 * zwischen Gelenkwinkeln interpoliert (schnell und ruckelfrei).
 */
export type Step =
  | { kind: 'move'; to: JointMap; duration: number }
  | { kind: 'attach'; page: PageId } // Block an den Greifer hängen
  | { kind: 'release'; page: PageId; at: THREE.Vector3 } // Block an Position ablegen
  | { kind: 'call'; fn: () => void }

export const GRIPPER_OPEN = 0.6
export const GRIPPER_CLOSED = 0.28
export const WRIST_ROLL = 0

/** Ruhepose: aufrecht, Greifer zeigt "bereit" nach unten. */
export const HOME: JointMap = {
  shoulder_pan: 0,
  shoulder_lift: -0.9,
  elbow_flex: 0.9,
  wrist_flex: 1.5,
  wrist_roll: WRIST_ROLL,
  gripper: 0.3,
}

const JOINT_SPEED = 1.9 // rad/s für das Gelenk mit dem größten Weg

function moveDuration(from: JointMap, to: JointMap, min = 0.35) {
  let max = 0
  for (const k of Object.keys(to)) max = Math.max(max, Math.abs((to[k] ?? 0) - (from[k] ?? 0)))
  return Math.max(min, max / JOINT_SPEED)
}

class PlanBuilder {
  steps: Step[] = []
  current: JointMap
  robot: URDFRobot
  constructor(robot: URDFRobot, start: JointMap) {
    this.robot = robot
    this.current = { ...start }
  }

  move(target: Partial<JointMap>, min?: number) {
    const to = { ...this.current, ...target } as JointMap
    this.steps.push({ kind: 'move', to, duration: moveDuration(this.current, to, min) })
    this.current = to
  }

  /** Greifer per IK an eine Weltposition fahren (zeigt nach unten) */
  reach(pos: THREE.Vector3, min?: number) {
    const res = solveIKRobust(this.robot, pos, this.current)
    if (res.error > 0.01) console.warn('IK: Ziel kaum erreichbar', pos.toArray(), res.error)
    this.move({ ...res.joints, wrist_roll: WRIST_ROLL }, min)
  }

  gripper(value: number) {
    this.move({ gripper: value }, 0.3)
  }

  push(step: Step) {
    this.steps.push(step)
  }
}

const up = (p: THREE.Vector3, h: number) => new THREE.Vector3(p.x, h, p.z)

/** Block von `from` nach `to` tragen und anschließend nach Hause fahren. */
function pickAndPlace(b: PlanBuilder, page: PageId, from: THREE.Vector3, to: THREE.Vector3) {
  b.gripper(GRIPPER_OPEN)
  b.reach(up(from, HOVER_HEIGHT))
  b.reach(up(from, GRIP_HEIGHT), 0.5)
  b.gripper(GRIPPER_CLOSED)
  b.push({ kind: 'attach', page })
  b.reach(up(from, HOVER_HEIGHT), 0.5)
  b.reach(up(to, HOVER_HEIGHT))
  b.reach(up(to, GRIP_HEIGHT), 0.5)
  b.push({ kind: 'release', page, at: to.clone() })
  b.gripper(GRIPPER_OPEN)
  b.reach(up(to, HOVER_HEIGHT), 0.4)
}

/** Block einer Seite zur Drop-Zone bringen. */
export function planOpen(robot: URDFRobot, start: JointMap, page: PageId, onDone: () => void) {
  const b = new PlanBuilder(robot, start)
  pickAndPlace(b, page, slotOf(page).position, PORTAL.position)
  b.move(HOME)
  b.push({ kind: 'call', fn: onDone })
  return b.steps
}

/** Block von der Drop-Zone zurück auf seinen Platz bringen. */
export function planReturn(robot: URDFRobot, start: JointMap, page: PageId, onDone: () => void) {
  const b = new PlanBuilder(robot, start)
  pickAndPlace(b, page, PORTAL.position, slotOf(page).position)
  b.move(HOME)
  b.push({ kind: 'call', fn: onDone })
  return b.steps
}

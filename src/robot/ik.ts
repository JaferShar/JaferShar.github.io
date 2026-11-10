import * as THREE from 'three'
import type { URDFRobot } from 'urdf-loader'

/**
 * Numerische Inverse Kinematik (Damped Least Squares) für den SO-101.
 *
 * Gelöst werden die 4 Gelenke, die Position + "Greifer zeigt nach unten" bestimmen.
 * wrist_roll und gripper werden separat gesetzt.
 * Die Jacobi-Matrix wird per finiten Differenzen direkt aus der URDF berechnet –
 * dadurch funktioniert das mit jedem seriellen Arm, ohne Geometrie von Hand herzuleiten.
 */

export const ARM_JOINTS = ['shoulder_pan', 'shoulder_lift', 'elbow_flex', 'wrist_flex'] as const
export const ALL_JOINTS = [...ARM_JOINTS, 'wrist_roll', 'gripper'] as const
export type JointMap = Record<string, number>

/** Name des Links, der den Tool Center Point (Mitte zwischen den Fingern) darstellt. */
export const TCP_LINK = 'gripper_frame_link'

const _pos = new THREE.Vector3()
const _axis = new THREE.Vector3()

export function getJoints(robot: URDFRobot, names: readonly string[] = ALL_JOINTS): JointMap {
  const out: JointMap = {}
  for (const n of names) out[n] = Number(robot.joints[n].angle)
  return out
}

export function setJoints(robot: URDFRobot, map: JointMap) {
  for (const [n, v] of Object.entries(map)) robot.joints[n]?.setJointValue(v)
}

function clampToLimits(robot: URDFRobot, name: string, v: number) {
  const j = robot.joints[name]
  const lo = Number(j.limit.lower)
  const hi = Number(j.limit.upper)
  return Math.min(hi, Math.max(lo, v))
}

/** Liefert Position und Annäherungsachse (lokale z-Achse) des Greifers in Weltkoordinaten. */
export function readTcp(robot: URDFRobot, pos = _pos, axis = _axis) {
  const frame = robot.links[TCP_LINK] ?? robot.frames[TCP_LINK]
  frame.updateWorldMatrix(true, false)
  pos.setFromMatrixPosition(frame.matrixWorld)
  axis.set(0, 0, 1).transformDirection(frame.matrixWorld)
  return { pos, axis }
}

const ORI_WEIGHT = 0.08 // wie stark die Ausrichtung im Vergleich zur Position zählt (m pro rad)

function residual(robot: URDFRobot, target: THREE.Vector3, approach: THREE.Vector3, out: number[]) {
  const { pos, axis } = readTcp(robot)
  out[0] = target.x - pos.x
  out[1] = target.y - pos.y
  out[2] = target.z - pos.z
  // Kreuzprodukt = Drehachse * sin(Winkel) zwischen Ist- und Soll-Ausrichtung
  const c = new THREE.Vector3().crossVectors(axis, approach)
  out[3] = c.x * ORI_WEIGHT
  out[4] = c.y * ORI_WEIGHT
  out[5] = c.z * ORI_WEIGHT
  return out
}

/** Löst A x = b für eine kleine, quadratische Matrix (Gauß mit Pivotisierung). */
function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length
  const M = A.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let p = c
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r
    ;[M[c], M[p]] = [M[p], M[c]]
    const d = M[c][c] || 1e-12
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const f = M[r][c] / d
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12))
}

export interface IKResult {
  joints: JointMap
  /** Restfehler der Position in Metern */
  error: number
}

/**
 * Sucht Gelenkwinkel, sodass der Greifer an `target` sitzt und entlang `approach` zeigt.
 * Ändert den Roboter NICHT dauerhaft – der Ausgangszustand wird wiederhergestellt.
 */
export function solveIK(
  robot: URDFRobot,
  target: THREE.Vector3,
  approach = new THREE.Vector3(0, -1, 0),
  seed?: JointMap,
  iterations = 150,
): IKResult {
  const saved = getJoints(robot)
  if (seed) setJoints(robot, seed)

  const names = ARM_JOINTS
  const q = names.map((n) => Number(robot.joints[n].angle))
  const r = new Array(6).fill(0)
  const rTmp = new Array(6).fill(0)
  const eps = 1e-4
  const lambda = 0.02

  for (let it = 0; it < iterations; it++) {
    residual(robot, target, approach, r)
    const posErr = Math.hypot(r[0], r[1], r[2])
    if (posErr < 2e-4 && Math.hypot(r[3], r[4], r[5]) < 2e-4) break

    // Jacobi-Matrix per finiten Differenzen (6 x 4)
    const J: number[][] = Array.from({ length: 6 }, () => new Array(names.length).fill(0))
    for (let j = 0; j < names.length; j++) {
      robot.joints[names[j]].setJointValue(q[j] + eps)
      residual(robot, target, approach, rTmp)
      for (let i = 0; i < 6; i++) J[i][j] = -(rTmp[i] - r[i]) / eps
      robot.joints[names[j]].setJointValue(q[j])
    }

    // dq = (J^T J + λ² I)^-1 J^T r
    const JtJ = names.map((_, a) => names.map((_, b) => J.reduce((s, row) => s + row[a] * row[b], 0) + (a === b ? lambda * lambda : 0)))
    const Jtr = names.map((_, a) => J.reduce((s, row, i) => s + row[a] * r[i], 0))
    const dq = solveLinear(JtJ, Jtr)

    for (let j = 0; j < names.length; j++) {
      const step = Math.max(-0.3, Math.min(0.3, dq[j]))
      q[j] = clampToLimits(robot, names[j], q[j] + step)
      robot.joints[names[j]].setJointValue(q[j])
    }
  }

  residual(robot, target, approach, r)
  const result: IKResult = {
    joints: Object.fromEntries(names.map((n, i) => [n, q[i]])),
    error: Math.hypot(r[0], r[1], r[2]),
  }
  setJoints(robot, saved)
  return result
}

/** Probiert mehrere Startwerte und nimmt die beste Lösung. */
export function solveIKRobust(robot: URDFRobot, target: THREE.Vector3, seed?: JointMap): IKResult {
  const pan = Math.atan2(target.x, target.z) // grober Startwert für die Drehung
  const seeds: (JointMap | undefined)[] = [
    seed,
    { shoulder_pan: pan, shoulder_lift: 0, elbow_flex: 0, wrist_flex: 1 },
    { shoulder_pan: -pan, shoulder_lift: 0, elbow_flex: 0, wrist_flex: 1 },
    { shoulder_pan: pan, shoulder_lift: -0.8, elbow_flex: 0.8, wrist_flex: 1.2 },
    { shoulder_pan: -pan, shoulder_lift: 0.8, elbow_flex: -0.8, wrist_flex: -1.2 },
  ]
  let best: IKResult | null = null
  for (const s of seeds) {
    const res = solveIK(robot, target, undefined, s)
    if (!best || res.error < best.error) best = res
    if (best.error < 1e-3) break
  }
  return best!
}

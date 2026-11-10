import * as THREE from 'three'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'

/**
 * Point-Cloud-Darstellung des Roboters.
 *
 * Für jedes Mesh werden Punkte auf der Oberfläche verteilt (Anzahl ∝ Fläche).
 * Die Punkte hängen als Geschwister am selben Link wie das Mesh – sie folgen
 * also automatisch allen Gelenkbewegungen (IK, Greifen, Idle).
 *
 * Shader-Ideen inspiriert von kaira.ing: weiche runde Punkte, zufällige Größe,
 * Tiefen-Fade, leichtes Driften und ein "Zusammensetzen" beim Einblenden.
 */

const TOTAL_POINTS = 45_000
const MIN_POINTS_PER_MESH = 300

/** Gemeinsame Uniforms für alle Punktwolken-Materialien. */
export const cloudUniforms = {
  uMix: { value: 0 }, // 0 = solide, 1 = Punktwolke
  uTime: { value: 0 },
  uDpr: { value: 1 },
  uSize: { value: 1.5 },
  uDrift: { value: 1 },
}

const vertexShader = /* glsl */ `
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uDpr;
  uniform float uSize;
  uniform float uDrift;
  varying float vAlpha;

  // Pseudo-zufällige Richtung pro Punkt
  vec3 randDir(float r) {
    return normalize(vec3(sin(r * 127.1), sin(r * 311.7), sin(r * 74.7)) + 1e-4);
  }

  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);

    // Leichtes Atmen/Driften in Weltkoordinaten (Meter)
    world.xyz += uDrift * 0.0007 * vec3(
      sin(uTime * 0.7 + aRand * 41.0),
      sin(uTime * 0.9 + aRand * 23.0),
      cos(uTime * 0.8 + aRand * 31.0));

    // Beim Einblenden fliegen die Punkte von außen herein (gestaffelt pro Punkt)
    float k = smoothstep(aRand * 0.5, aRand * 0.5 + 0.5, uMix);
    world.xyz += randDir(aRand * 97.0 + 1.0) * (1.0 - k) * 0.12;

    vec4 mv = viewMatrix * world;
    float d = max(-mv.z, 0.001);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = clamp(uSize * uDpr * (0.7 + aRand * 0.6) / d, 1.0, 5.0 * uDpr);

    // Weiter entfernte Punkte blasser (Tiefen-Fade)
    float fade = clamp(1.5 - (d - 0.5) * 0.9, 0.35, 1.0);
    vAlpha = k * fade;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.1, d) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
    #include <colorspace_fragment>
  }
`

function hash(i: number) {
  return ((i * 0x9e3779b1) >>> 0) % 1000 / 1000
}

function worldArea(mesh: THREE.Mesh) {
  const geo = mesh.geometry
  const pos = geo.attributes.position
  const idx = geo.index
  const s = new THREE.Vector3()
  mesh.matrixWorld.decompose(new THREE.Vector3(), new THREE.Quaternion(), s)
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const c = new THREE.Vector3()
  const tris = idx ? idx.count / 3 : pos.count / 3
  let area = 0
  for (let t = 0; t < tris; t++) {
    const i0 = idx ? idx.getX(t * 3) : t * 3
    const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1
    const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2
    a.fromBufferAttribute(pos, i0).multiply(s)
    b.fromBufferAttribute(pos, i1).multiply(s)
    c.fromBufferAttribute(pos, i2).multiply(s)
    area += new THREE.Triangle(a, b, c).getArea()
  }
  return area
}

export interface PointCloud {
  meshes: THREE.Mesh[]
  points: THREE.Points[]
  dispose: () => void
}

/**
 * Baut die Punktwolke für alle Meshes des Roboters.
 * `colorOf` liefert die Punktfarbe pro Mesh (z. B. Gelb für Gehäuse, Grau für Servos).
 */
export function buildPointCloud(root: THREE.Object3D, colorOf: (m: THREE.Mesh) => THREE.ColorRepresentation): PointCloud {
  root.updateMatrixWorld(true)

  const meshes: THREE.Mesh[] = []
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh)
  })

  const areas = meshes.map(worldArea)
  const totalArea = areas.reduce((s, a) => s + a, 0) || 1

  const points: THREE.Points[] = []
  const tmp = new THREE.Vector3()
  let seed = 0

  meshes.forEach((mesh, mi) => {
    const count = Math.max(MIN_POINTS_PER_MESH, Math.round((areas[mi] / totalArea) * TOTAL_POINTS))
    const sampler = new MeshSurfaceSampler(mesh).build()
    const positions = new Float32Array(count * 3)
    const rands = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      sampler.sample(tmp)
      positions.set([tmp.x, tmp.y, tmp.z], i * 3)
      rands[i] = hash(seed++)
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aRand', new THREE.BufferAttribute(rands, 1))

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        ...cloudUniforms,
        uColor: { value: new THREE.Color(colorOf(mesh)) },
        uOpacity: { value: 0.9 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    })

    const cloud = new THREE.Points(geo, material)
    cloud.name = `${mesh.name || 'mesh'}-points`
    // Gleiche lokale Transformation wie das Mesh, aber als Geschwister –
    // so bleibt die Wolke sichtbar, auch wenn das Mesh ausgeblendet ist.
    cloud.matrixAutoUpdate = false
    cloud.matrix.copy(mesh.matrix)
    cloud.frustumCulled = false
    cloud.visible = false
    mesh.parent!.add(cloud)
    points.push(cloud)
  })

  return {
    meshes,
    points,
    dispose() {
      for (const p of points) {
        p.removeFromParent()
        p.geometry.dispose()
        ;(p.material as THREE.Material).dispose()
      }
    },
  }
}

/** Überblendung zwischen solider Darstellung und Punktwolke anwenden. */
export function applyCloudMix(cloud: PointCloud, mix: number) {
  for (const p of cloud.points) p.visible = mix > 0.001
  for (const m of cloud.meshes) {
    const mat = m.material as THREE.MeshStandardMaterial
    const opacity = 1 - THREE.MathUtils.smoothstep(mix, 0, 0.6)
    m.visible = opacity > 0.001
    mat.transparent = opacity < 0.999
    mat.depthWrite = opacity > 0.5
    mat.opacity = opacity
    m.castShadow = opacity > 0.5
  }
}

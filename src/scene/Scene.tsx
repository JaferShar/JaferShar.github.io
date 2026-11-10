import { Canvas } from '@react-three/fiber'
import { Grid, OrbitControls } from '@react-three/drei'
import { Robot } from '../robot/Robot'
import { Blocks } from './Blocks'
import { Portal } from './Portal'
import { CursorControl } from './CursorControl'
import { useRoute } from '../navigation'
import { CameraRig, CAMERA_TARGET } from './CameraRig'

export function Scene() {
  // Solange eine Projektseite offen ist, verdeckt sie die Szene komplett → Rendering pausieren
  const { project } = useRoute()
  return (
    <Canvas shadows dpr={[1, 2]} frameloop={project ? 'never' : 'always'} camera={{ fov: 32, near: 0.01, far: 20, position: [0, 0.45, 0.65] }}>
      <color attach="background" args={['#0f0f10']} />
      <fog attach="fog" args={['#0f0f10', 1.4, 3.2]} />
      <CameraRig />

      <ambientLight intensity={0.35} />
      <hemisphereLight args={['#ffffff', '#202020', 0.6]} />
      <directionalLight
        position={[0.4, 0.9, 0.5]}
        intensity={2.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-0.4}
        shadow-camera-right={0.4}
        shadow-camera-top={0.4}
        shadow-camera-bottom={-0.4}
        shadow-bias={-0.0005}
      />
      <directionalLight position={[-0.6, 0.4, -0.3]} intensity={0.6} color="#9fb4ff" />

      {/* Tisch */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[6, 6]} />
        <meshStandardMaterial color="#161617" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0.0002, 0]}
        args={[4, 4]}
        cellSize={0.02}
        cellThickness={0.6}
        cellColor="#262628"
        sectionSize={0.1}
        sectionThickness={1}
        sectionColor="#3a3a3d"
        fadeDistance={1.6}
        fadeStrength={1.5}
        infiniteGrid
      />

      <Robot />
      <Blocks />
      <Portal />
      <CursorControl />

      <OrbitControls
        target={CAMERA_TARGET}
        enablePan={false}
        enableDamping
        minDistance={0.3}
        maxDistance={1.8}
        minPolarAngle={0.2}
        maxPolarAngle={1.35}
      />
    </Canvas>
  )
}

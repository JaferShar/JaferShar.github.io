import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { PAGES } from '../content'
import { useStore } from '../store'
import { BLOCK_SIZE, PORTAL, polar, RING_RADIUS } from './layout'
import { FONT_REGULAR } from './fonts'

/** Die Drop-Zone: Hier abgelegte Blöcke öffnen ihre Seite. */
export function Portal() {
  const ring = useRef<THREE.MeshBasicMaterial>(null)
  const docked = useStore((s) => s.docked)
  const color = docked ? PAGES.find((p) => p.id === docked)!.color : '#e8e8e8'
  const label = polar(PORTAL.angle, RING_RADIUS + 0.05, 0.0005)

  useFrame(({ clock }) => {
    if (ring.current) ring.current.opacity = 0.45 + Math.sin(clock.elapsedTime * 3) * 0.25
  })

  return (
    <group>
      <group position={[PORTAL.position.x, 0.0006, PORTAL.position.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[BLOCK_SIZE * 0.95, BLOCK_SIZE * 1.12, 48]} />
          <meshBasicMaterial ref={ring} color={color} transparent />
        </mesh>
        <mesh>
          <circleGeometry args={[BLOCK_SIZE * 0.95, 48]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} />
        </mesh>
      </group>
      <Text
        font={FONT_REGULAR}
        fontSize={0.0085}
        position={label}
        rotation={[-Math.PI / 2, 0, 0]}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {docked ? '[ LOADED ]' : '[ DROP ZONE ]'}
      </Text>
    </group>
  )
}

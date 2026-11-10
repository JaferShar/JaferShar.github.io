import { useLayoutEffect, useRef } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { PAGES } from '../content'
import { useStore } from '../store'
import { navigate } from '../navigation'
import { BLOCK_SIZE, RING_RADIUS, SLOTS, polar } from './layout'
import { FONT_BOLD, FONT_REGULAR } from './fonts'

function Block({ index }: { index: number }) {
  const slot = SLOTS[index]
  const page = PAGES.find((p) => p.id === slot.page)!
  const ref = useRef<THREE.Group>(null)
  const hovered = useStore((s) => s.hovered === page.id)
  const docked = useStore((s) => s.docked === page.id)

  // Position nur EINMAL setzen – danach bewegt der Roboter den Block imperativ.
  useLayoutEffect(() => {
    const g = ref.current!
    g.userData.homeParent = g.parent
    g.position.set(slot.position.x, BLOCK_SIZE / 2, slot.position.z)
    g.rotation.set(0, Math.atan2(slot.position.x, slot.position.z), 0)
    useStore.getState().registerBlock(page.id, g)
    return () => useStore.getState().registerBlock(page.id, null)
  }, [page.id, slot])

  return (
    <group
      ref={ref}
      onPointerOver={(e) => {
        e.stopPropagation()
        useStore.getState().setHovered(page.id)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        useStore.getState().setHovered(null)
        document.body.style.cursor = ''
      }}
      onClick={(e) => {
        e.stopPropagation()
        navigate(docked ? null : page.id)
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE]} />
        <meshStandardMaterial
          color={page.color}
          emissive={page.color}
          emissiveIntensity={hovered ? 0.55 : 0.12}
          roughness={0.35}
        />
      </mesh>
      {/* Nummer auf der Oberseite */}
      <Text
        font={FONT_BOLD}
        fontSize={BLOCK_SIZE * 0.42}
        position={[0, BLOCK_SIZE / 2 + 0.0004, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color="#111"
        anchorX="center"
        anchorY="middle"
      >
        {String(index + 1).padStart(2, '0')}
      </Text>
    </group>
  )
}

/** Beschriftung, die flach auf dem Tisch vor jedem Startplatz liegt. */
function SlotLabel({ index }: { index: number }) {
  const slot = SLOTS[index]
  const page = PAGES.find((p) => p.id === slot.page)!
  const pos = polar(slot.angle, RING_RADIUS + 0.042, 0.0005)
  const empty = useStore((s) => s.docked === page.id)
  return (
    <group position={pos} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh position={[0, 0.042, 0]}>
        <ringGeometry args={[BLOCK_SIZE * 0.85, BLOCK_SIZE * 0.92, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color={empty ? page.color : '#3a3a3a'} />
      </mesh>
      <Text font={FONT_REGULAR} fontSize={0.0085} color={empty ? page.color : '#8a8a8a'} anchorX="center" anchorY="top">
        {`${String(index + 1).padStart(3, '0')} / ${page.label}`}
      </Text>
    </group>
  )
}

export function Blocks() {
  return (
    <group>
      {SLOTS.map((_, i) => (
        <Block key={i} index={i} />
      ))}
      {SLOTS.map((_, i) => (
        <SlotLabel key={`l${i}`} index={i} />
      ))}
    </group>
  )
}

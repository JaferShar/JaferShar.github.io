import { create } from 'zustand'
import type * as THREE from 'three'
import type { URDFRobot } from 'urdf-loader'
import type { PageId } from './content'

/**
 * Globaler Zustand der Seite.
 * - `request` ist ein Auftrag an den Roboter ("öffne Seite X" / "schließe Seite")
 * - Der Roboter (Robot.tsx) arbeitet Aufträge ab und meldet zurück, wenn er fertig ist.
 */
export type Request = { type: 'open'; page: PageId; instant?: boolean } | { type: 'close'; instant?: boolean }

interface State {
  robot: URDFRobot | null
  loaded: boolean
  busy: boolean
  /** Seite, deren Block gerade in der Drop-Zone liegt */
  docked: PageId | null
  /** Seite, deren Overlay gerade sichtbar ist */
  activePage: PageId | null
  /** Ohne Animation direkt springen (für eilige Besucher) */
  instant: boolean
  request: Request | null
  blocks: Partial<Record<PageId, THREE.Object3D>>
  hovered: PageId | null

  setRobot: (r: URDFRobot) => void
  setLoaded: () => void
  registerBlock: (id: PageId, obj: THREE.Object3D | null) => void
  setHovered: (id: PageId | null) => void
  toggleInstant: () => void
  open: (page: PageId, instant?: boolean) => void
  close: (instant?: boolean) => void
}

export const useStore = create<State>((set, get) => ({
  robot: null,
  loaded: false,
  busy: false,
  docked: null,
  activePage: null,
  instant: false,
  request: null,
  blocks: {},
  hovered: null,

  setRobot: (robot) => set({ robot }),
  setLoaded: () => set({ loaded: true }),
  registerBlock: (id, obj) =>
    set((s) => {
      const blocks = { ...s.blocks }
      if (obj) blocks[id] = obj
      else delete blocks[id]
      return { blocks }
    }),
  setHovered: (hovered) => set({ hovered }),
  toggleInstant: () => set((s) => ({ instant: !s.instant })),

  open: (page, instant) => {
    const s = get()
    if (s.busy || s.activePage === page) return
    set({ request: { type: 'open', page, instant: instant ?? s.instant } })
  },
  close: (instant) => {
    const s = get()
    if (s.busy || !s.docked) return
    set({ request: { type: 'close', instant: instant ?? s.instant } })
  },
}))

// Debug-Zugriff in der Browser-Konsole: window.__robo.getState()
;(window as unknown as { __robo: typeof useStore }).__robo = useStore

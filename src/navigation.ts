import { useSyncExternalStore } from 'react'
import { PAGES, PROJECTS, type PageId } from './content'
import { useStore } from './store'

/**
 * Die URL ist die "Quelle der Wahrheit":
 *   #/projects                 → Projekte-Panel
 *   #/projects/<slug>          → eigene Detailseite eines Projekts
 * So funktionieren Zurück-Button und direkte Links (z. B. im Lebenslauf: deinname.github.io/#/projects/xyz).
 * Hash-Routing funktioniert auf GitHub Pages ohne Server-Konfiguration.
 */

export interface Route {
  page: PageId | null
  project: string | null
}

function parseHash(hash: string): Route {
  const [first, second] = hash.replace(/^#\/?/, '').split('/')
  const page = PAGES.find((p) => p.id === first)?.id ?? null
  const project = page === 'projects' ? (PROJECTS.find((p) => p.slug === second)?.slug ?? null) : null
  return { page, project }
}

export function pageFromHash(): PageId | null {
  return parseHash(window.location.hash).page
}

export function navigate(page: PageId | null, project?: string) {
  window.location.hash = page ? `/${page}${project ? `/${project}` : ''}` : '/'
}

// ---------- React-Hook für die aktuelle Route ----------
let cached: { hash: string; route: Route } | null = null
function getRoute(): Route {
  const hash = window.location.hash
  if (!cached || cached.hash !== hash) cached = { hash, route: parseHash(hash) }
  return cached.route
}
function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, getRoute)
}

/** Einmal beim Start aufrufen, sobald der Roboter geladen ist. */
export function initNavigation() {
  const initial = pageFromHash()
  if (initial) useStore.getState().open(initial, true) // Direktlink: ohne Animation öffnen

  const onHash = () => {
    const page = pageFromHash()
    if (page) useStore.getState().open(page)
    else useStore.getState().close()
  }
  window.addEventListener('hashchange', onHash)
  return () => window.removeEventListener('hashchange', onHash)
}

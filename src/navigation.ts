import { PAGES, type PageId } from './content'
import { useStore } from './store'

/**
 * Die URL ist die "Quelle der Wahrheit": #/projects öffnet die Projekte-Seite.
 * So funktionieren Zurück-Button und direkte Links (z. B. im Lebenslauf: deinname.github.io/#/cv).
 * Hash-Routing funktioniert auf GitHub Pages ohne Server-Konfiguration.
 */

export function pageFromHash(): PageId | null {
  const id = window.location.hash.replace(/^#\/?/, '')
  return PAGES.find((p) => p.id === id)?.id ?? null
}

export function navigate(page: PageId | null) {
  window.location.hash = page ? `/${page}` : '/'
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

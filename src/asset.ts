/** Pfade aus content.ts (relativ zu public/) → URL; externe Links bleiben unverändert. */
export function asset(src: string) {
  return /^(https?:)?\/\//.test(src) ? src : `${import.meta.env.BASE_URL}${src.replace(/^\//, '')}`
}

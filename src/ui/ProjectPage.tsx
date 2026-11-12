import { useEffect, useRef, useState } from 'react'
import { PAGES, PROJECTS, SITE, type Media, type Project, type ProjectBlock } from '../content'
import { navigate, useRoute } from '../navigation'
import { asset } from '../asset'

const ACCENT = PAGES.find((p) => p.id === 'projects')!.color

/**
 * Eigene, bildschirmfüllende Seite für ein Projekt (#/projects/<slug>).
 * Liegt über der 3D-Szene; die Szene pausiert solange (siehe Scene.tsx).
 */
export function ProjectPage() {
  const { project: slug } = useRoute()
  const index = PROJECTS.findIndex((p) => p.slug === slug)
  const open = index >= 0

  // Letztes Projekt merken, damit der Inhalt beim Rausfahren sichtbar bleibt
  const [shown, setShown] = useState(index)
  if (open && index !== shown) setShown(index)
  const project = PROJECTS[shown] as Project | undefined

  const scroller = useRef<HTMLDivElement>(null)
  const [lightbox, setLightbox] = useState<Media | null>(null)

  // Beim Wechsel nach oben scrollen + Tab-Titel setzen
  useEffect(() => {
    if (!open) return
    scroller.current?.scrollTo({ top: 0 })
    const prev = document.title
    document.title = `${PROJECTS[index].title} · ${SITE.name}`
    return () => {
      document.title = prev
    }
  }, [open, index])

  // Escape: erst Lightbox schließen, dann die Seite
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (lightbox) setLightbox(null)
      else navigate('projects')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, lightbox])

  const prev = PROJECTS[(shown - 1 + PROJECTS.length) % PROJECTS.length]
  const next = PROJECTS[(shown + 1) % PROJECTS.length]

  return (
    <div
      ref={scroller}
      className={`project-page ${open ? 'open' : ''}`}
      style={{ '--accent': ACCENT } as React.CSSProperties}
      aria-hidden={!open}
    >
      {project && (
        <>
          <header className="pp-bar">
            <button onClick={() => navigate('projects')}>← BACK TO PROJECTS</button>
            <span className="pp-count">
              PROJECT {String(shown + 1).padStart(2, '0')} / {String(PROJECTS.length).padStart(2, '0')}
            </span>
          </header>

          <article className="pp-article">
            <div className="pp-meta">{project.meta}</div>
            <h1>{project.title}</h1>
            <p className="pp-summary">{project.summary}</p>
            <ul className="tags">
              {project.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            {project.links && project.links.length > 0 && (
              <div className="pp-links">
                {project.links.map((l) => (
                  <a key={l.href + l.label} href={l.href} target="_blank" rel="noreferrer">
                    → {l.label}
                  </a>
                ))}
              </div>
            )}

            {project.cover && <Figure media={project.cover} className="pp-cover" onOpen={setLightbox} />}

            <div className="pp-body">
              {project.body.map((b, i) => (
                <Block key={i} block={b} onOpen={setLightbox} />
              ))}
            </div>

            {PROJECTS.length > 1 && (
              <nav className="pp-pager">
                <button onClick={() => navigate('projects', prev.slug)}>
                  <span>← PREVIOUS</span>
                  {prev.title}
                </button>
                <button onClick={() => navigate('projects', next.slug)}>
                  <span>NEXT →</span>
                  {next.title}
                </button>
              </nav>
            )}
          </article>
        </>
      )}

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)} role="dialog" aria-label="Image preview">
          <img src={asset(lightbox.src)} alt={lightbox.alt ?? lightbox.caption ?? ''} />
          {lightbox.caption && <p>{lightbox.caption}</p>}
        </div>
      )}
    </div>
  )
}

function Block({ block, onOpen }: { block: ProjectBlock; onOpen: (m: Media) => void }) {
  switch (block.type) {
    case 'heading':
      return <h2>{block.text}</h2>
    case 'text':
      return (
        <>
          {block.text.split(/\n\s*\n/).map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </>
      )
    case 'image':
      return <Figure media={block.image} onOpen={onOpen} />
    case 'gallery':
      return (
        <div className={block.portrait ? 'pp-gallery pp-gallery--portrait' : 'pp-gallery'}>
          {block.images.map((m) => (
            <Figure key={m.src} media={m} onOpen={onOpen} />
          ))}
        </div>
      )
    case 'video':
      return (
        <figure className="pp-figure">
          {/youtube\.com|youtu\.be|vimeo\.com/.test(block.src) ? (
            <iframe
              src={block.src}
              title={block.caption ?? 'Video'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <video
              src={asset(block.src)}
              poster={block.poster ? asset(block.poster) : undefined}
              controls
              playsInline
              preload="metadata"
            />
          )}
          {block.caption && <figcaption>{block.caption}</figcaption>}
        </figure>
      )
  }
}

function Figure({ media, className = '', onOpen }: { media: Media; className?: string; onOpen: (m: Media) => void }) {
  return (
    <figure className={`pp-figure ${className}`}>
      <button className="pp-zoom" onClick={() => onOpen(media)} aria-label={`Enlarge ${media.caption ?? 'image'}`}>
        <img src={asset(media.src)} alt={media.alt ?? media.caption ?? ''} loading="lazy" />
      </button>
      {media.caption && <figcaption>{media.caption}</figcaption>}
    </figure>
  )
}

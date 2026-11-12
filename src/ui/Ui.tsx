import { useEffect, useState } from 'react'
import { PAGES, SITE } from '../content'
import { useStore } from '../store'
import { navigate } from '../navigation'
import { asset } from '../asset'
import { ARM_JOINTS } from '../robot/ik'

/** Obere Leiste: Name + normale Navigation (für Besucher, die es eilig haben). */
export function Nav() {
  const instant = useStore((s) => s.instant)
  const docked = useStore((s) => s.docked)
  const busy = useStore((s) => s.busy)
  const pointCloud = useStore((s) => s.pointCloud)
  return (
    <header className="nav">
      <button className="brand" onClick={() => navigate(null)}>
        <span className="brand-name">{SITE.name}</span>
        <span className="brand-tag">{SITE.tagline}</span>
      </button>
      <nav>
        {PAGES.map((p, i) => (
          <button
            key={p.id}
            className={docked === p.id ? 'active' : ''}
            style={{ '--accent': p.color } as React.CSSProperties}
            onClick={() => navigate(p.id)}
          >
            <span className="idx">{String(i + 1).padStart(2, '0')}</span>
            {p.label}
          </button>
        ))}
        <button className={`toggle ${instant ? 'on' : ''}`} onClick={() => useStore.getState().toggleInstant()} title="Skip robot animation">
          {instant ? '>> FAST' : '~ ROBOT'}
        </button>
        <button className={`toggle ${pointCloud ? 'on' : ''}`} onClick={() => useStore.getState().togglePointCloud()} title="Toggle point cloud view">
          {pointCloud ? '::: POINTS' : '### SOLID'}
        </button>
      </nav>
      {busy && <div className="busy" />}
    </header>
  )
}

/** Live-Telemetrie der Gelenkwinkel unten links. */
export function Hud() {
  const robot = useStore((s) => s.robot)
  const busy = useStore((s) => s.busy)
  const [angles, setAngles] = useState<number[]>([])
  useEffect(() => {
    if (!robot) return
    const id = setInterval(() => setAngles(ARM_JOINTS.map((n) => Number(robot.joints[n].angle))), 80)
    return () => clearInterval(id)
  }, [robot])
  return (
    <div className="hud">
      <div className="hud-title">
        SO-101 / {busy ? <span className="blink">EXECUTING</span> : 'IDLE'}
      </div>
      {ARM_JOINTS.map((n, i) => (
        <div key={n} className="hud-row">
          <span>J{i + 1}</span>
          <span className="hud-name">{n}</span>
          <span className="hud-val">{angles[i] !== undefined ? fmt((angles[i] * 180) / Math.PI) : '---.-'}°</span>
        </div>
      ))}
    </div>
  )
}

const fmt = (deg: number) => (deg >= 0 ? '+' : '-') + Math.abs(deg).toFixed(1).padStart(5, '0')

export function Hint() {
  const docked = useStore((s) => s.docked)
  const busy = useStore((s) => s.busy)
  const loaded = useStore((s) => s.loaded)
  if (!loaded || docked || busy) return null
  return <div className="hint">Move the cursor to steer the arm, then click a block to collect it</div>
}

export function Loader() {
  const loaded = useStore((s) => s.loaded)
  return (
    <div className={`loader ${loaded ? 'done' : ''}`}>
      <pre>{`> loading so101_new_calib.urdf\n> resolving meshes ...\n> booting arm`}</pre>
      <div className="bar" />
    </div>
  )
}

/** Seiteninhalt, erscheint wenn ein Block in der Drop-Zone liegt. */
export function Overlay() {
  const active = useStore((s) => s.activePage)
  // Letzte Seite merken, damit der Inhalt beim Rausfahren des Panels sichtbar bleibt
  const [shown, setShown] = useState(active)
  if (active && active !== shown) setShown(active)
  const index = PAGES.findIndex((p) => p.id === shown)
  const page = PAGES[index]

  return (
    <aside className={`panel ${active ? 'open' : ''}`} style={{ '--accent': page?.color } as React.CSSProperties}>
      {page && (
        <>
          <div className="panel-head">
            <span>
              {String(index + 1).padStart(3, '0')} / {page.label}
            </span>
            <button onClick={() => navigate(null)} aria-label="Close">
              [ x ] RETURN BLOCK
            </button>
          </div>
          {page.photo && (
            <figure className="panel-photo">
              <img src={asset(page.photo.src)} alt={page.photo.alt} />
              {page.photo.caption && <figcaption>{page.photo.caption}</figcaption>}
            </figure>
          )}
          <h1>{page.heading}</h1>
          <p className="intro">{page.intro}</p>
          {page.sections.map((s, i) => (
            <section key={i}>
              {s.image && (
                <a className="sec-thumb" href={s.link?.href.startsWith('#') ? s.link.href : undefined} tabIndex={-1}>
                  <img src={asset(s.image)} alt="" loading="lazy" />
                </a>
              )}
              <div className="sec-head">
                <h2>{s.title}</h2>
                {s.meta && <span className="meta">{s.meta}</span>}
              </div>
              {s.text && <p>{s.text}</p>}
              {s.tags && (
                <ul className="tags">
                  {s.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              )}
              {s.link &&
                (s.link.href.startsWith('#') ? (
                  <a href={s.link.href}>→ {s.link.label}</a>
                ) : (
                  <a href={s.link.href} target="_blank" rel="noreferrer">
                    → {s.link.label}
                  </a>
                ))}
            </section>
          ))}
        </>
      )}
    </aside>
  )
}

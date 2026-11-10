import { useEffect } from 'react'
import { Scene } from './scene/Scene'
import { Hint, Hud, Loader, Nav, Overlay } from './ui/Ui'
import { useStore } from './store'
import { initNavigation } from './navigation'

export default function App() {
  const loaded = useStore((s) => s.loaded)
  // Navigation erst starten, wenn der Roboter fertig geladen ist
  useEffect(() => (loaded ? initNavigation() : undefined), [loaded])

  return (
    <>
      <Scene />
      <Nav />
      <Hud />
      <Hint />
      <Overlay />
      <Loader />
    </>
  )
}

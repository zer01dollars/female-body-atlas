import { AtlasProvider } from './state/AtlasProvider'
import { Header } from './components/Header'
import { ControlDock } from './components/ControlDock'
import { Scene } from './components/Scene'
import { DetailPanel } from './components/DetailPanel'
import { Disclaimer } from './components/Disclaimer'

export default function App() {
  return (
    <AtlasProvider>
      <div className="app-shell">
        <Scene />
        <Header />
        <ControlDock />
        <DetailPanel />
        <Disclaimer />
      </div>
    </AtlasProvider>
  )
}

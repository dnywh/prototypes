import { Shell } from './components/Shell'
import { VisionProvider } from './state/store'

export function App() {
  return (
    <VisionProvider>
      <Shell />
    </VisionProvider>
  )
}

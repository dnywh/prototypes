import { AppShell } from './components/AppShell'
import { StudioProvider } from './state/store'

export function App() {
  return (
    <StudioProvider>
      <AppShell />
    </StudioProvider>
  )
}

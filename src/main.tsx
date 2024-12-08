import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)

// Enable HMR
if (import.meta.hot) {
  import.meta.hot.accept()
}

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)

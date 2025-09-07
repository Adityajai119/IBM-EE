import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import extension compatibility helper to suppress extension errors
import './utils/extensionCompatibility'

// Import WebContainer preload manager to handle WebContainer resource warnings
import './utils/webContainerPreloadManager'

// Import debug helper for development troubleshooting
import './utils/debugHelper'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

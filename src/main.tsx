import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { EmbedPage } from './components/EmbedPage'
import { ViewPage } from './components/ViewPage'

const path = window.location.pathname

function Root() {
  if (path.startsWith('/embed')) return <EmbedPage />
  if (path.startsWith('/view')) return <ViewPage />
  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)

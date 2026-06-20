import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { StoreProvider } from './lib/store.jsx'
import App from './App.jsx'
import './index.css'

// HashRouter：让 `npm run build` 后双击 dist/index.html（file://）也能正常路由
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </HashRouter>
  </React.StrictMode>
)

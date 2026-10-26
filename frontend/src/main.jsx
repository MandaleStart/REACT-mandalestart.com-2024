import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { SiteConfigProvider } from './config/SiteConfigProvider.jsx'
import { ServiceCatalogProvider } from './data/ServiceCatalogProvider.jsx'
import './index.css'
import './styles/base.css'
import './styles/buttons.css'
import './styles/layout.css'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <SiteConfigProvider>
      <ServiceCatalogProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ServiceCatalogProvider>
    </SiteConfigProvider>
  </React.StrictMode>
)

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
const prerenderedPath = root.dataset.prerenderPath?.replace(/\/+$/, '') || ''

if (root.hasChildNodes() && prerenderedPath === currentPath) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

const currentPath = window.location.pathname.replace(/\/+$/, '') || '/'
const prerenderedPath = root.dataset.prerenderPath?.replace(/\/+$/, '') || ''

if (root.hasChildNodes() && prerenderedPath === currentPath) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}

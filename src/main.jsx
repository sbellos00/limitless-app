import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import './index.css'

const path = window.location.pathname

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {path === '/landing' ? <LandingPage /> : <App />}
  </React.StrictMode>
)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './pages/LandingPage.jsx'
import './index.css'

const isLanding = window.location.pathname === '/landing'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isLanding ? <LandingPage /> : <App />}
  </React.StrictMode>
)

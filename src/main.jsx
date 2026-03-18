import React from 'react'
import ReactDOM from 'react-dom/client'
import { ThemeProvider } from './theme.jsx'
import MFApp from './components/MFApp.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <MFApp />
    </ThemeProvider>
  </React.StrictMode>
)

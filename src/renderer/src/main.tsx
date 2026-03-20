import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { StartupScreen } from './components/StartupScreen'
import './assets/index.css'

const page = window.location.hash.replace('#', '') || 'main'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  page === 'startup' ? <StartupScreen /> : <App />
)

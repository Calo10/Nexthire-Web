import React from 'react'
import ReactDOM from 'react-dom/client'
import Clarity from '@microsoft/clarity'
import App from './App.tsx'
import './index.css'
import './i18n/config'

Clarity.init('ycbt9uhr2n')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)


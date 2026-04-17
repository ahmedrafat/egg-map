import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { consumeSsoHash } from './lib/ssoConsume.js'
import './index.css'

// Pick up Supabase session tokens from #sso_at=... if we were bounced here
// from egyptbulkers.com (cross-app SSO), then render.
consumeSsoHash().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  )
})

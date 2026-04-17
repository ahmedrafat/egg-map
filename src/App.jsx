import { useAuth } from './lib/useAuth.js'
import LoginPage from './components/LoginPage.jsx'
import Dashboard from './components/Dashboard.jsx'

export default function App() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#FF6321] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginPage />

  return <Dashboard user={user} onSignOut={signOut} />
}

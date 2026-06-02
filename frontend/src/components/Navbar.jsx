import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⏱</span>
        <span className="text-white font-bold text-lg tracking-tight">Track me!</span>
        {user?.role === 'admin' && (
          <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
            Admin
          </span>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="text-gray-400 text-sm">{user?.name}</span>
        <button
          onClick={handleLogout}
          className="text-sm border border-gray-700 text-gray-300 px-4 py-1.5 rounded-lg hover:border-emerald-500 hover:text-emerald-400 transition-all"
        >
          Logout
        </button>
      </div>
    </nav>
  )
}
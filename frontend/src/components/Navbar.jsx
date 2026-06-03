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
          title="Logout"
          className="text-gray-400 hover:text-red-400 transition-all"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
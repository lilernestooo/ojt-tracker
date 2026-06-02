import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo-intern.png'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      navigate(user.role === 'admin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">

      {/* Left Side */}
      <div className="hidden md:flex w-1/2 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 40%, #7dd3fc 70%, #bae6fd 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute top-[-60px] left-[-60px] w-64 h-64 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute bottom-[-40px] right-[-40px] w-48 h-48 rounded-full opacity-20"
          style={{ background: 'rgba(255,255,255,0.4)' }} />
        <div className="absolute top-1/2 right-[-30px] w-32 h-32 rounded-full opacity-10"
          style={{ background: 'rgba(255,255,255,0.4)' }} />

        {/* Logo */}
        <div className="relative z-10 flex flex-col items-center">
        <img src={logo} alt="OJT Tracker Logo" className="w-48 h-48 object-contain mb-6" />

          <h1 className="text-5xl font-black text-white tracking-tight text-center drop-shadow-lg"
            style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            Track me!
          </h1>
          <p className="text-sky-100 text-center mt-3 text-lg max-w-xs font-medium">
            Track your internship hours and get certified every week 🎓
          </p>

          {/* Stats */}
          <div className="flex gap-6 mt-10 bg-white/20 backdrop-blur px-8 py-5 rounded-2xl">
            <div className="text-center">
              <p className="text-3xl font-black text-white">Hours</p>
              <p className="text-sky-100 text-xs uppercase tracking-widest mt-1">Required</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">100%</p>
              <p className="text-sky-100 text-xs uppercase tracking-widest mt-1">Complete</p>
            </div>
            <div className="w-px bg-white/30" />
            <div className="text-center">
              <p className="text-3xl font-black text-white">Free</p>
              <p className="text-sky-100 text-xs uppercase tracking-widest mt-1">Forever</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-12 bg-white">

        {/* Mobile Logo */}
        <div className="flex md:hidden items-center gap-3 mb-8">
          <img src={logo} alt="logo" className="w-12 h-12 object-contain" />
          <span className="text-2xl font-black text-slate-900" style={{ fontFamily: 'Georgia, serif' }}>
            Track me!
          </span>
        </div>

        <div className="w-full max-w-md">
          <h2 className="text-4xl font-black text-slate-900 mb-1"
            style={{ fontFamily: 'Georgia, serif' }}>
            Welcome back!
          </h2>
          <p className="text-slate-500 mb-8 text-base">Sign in to continue tracking your hours.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handle}
                required
                placeholder="juan@example.com"
                className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-all text-sm"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handle}
                  required
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-all text-sm pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-500 transition-all">
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 4.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 px-4 py-3">
                <p className="text-red-600 text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-bold py-3.5 transition-all text-sm uppercase tracking-widest"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}
            >
              {loading ? 'Signing in...' : '🚀 Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              No account?{' '}
              <Link to="/register" className="text-sky-500 font-bold hover:underline">
                Register here
              </Link>
            </p>
          </div>

          <p className="text-center text-slate-400 text-xs mt-8">
            Developed by <span className="font-bold text-sky-500">Ernesto</span> • Track me!
          </p>
        </div>
      </div>
    </div>
  )
}
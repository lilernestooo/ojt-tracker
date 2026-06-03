import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo-intern.png'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '',
    required_hours: 486, starting_hours: 0,
    auto_timeout_time: '17:00',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handle = e => {
    const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm(f => ({ ...f, [e.target.name]: val }))
  }

  const submit = async e => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      setSuccess('✅ Account created successfully! Please sign in.')
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
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

        <div className="relative z-10 flex flex-col items-center w-full">
          {/* Logo */}
          <img src={logo} alt="OJT Tracker Logo" className="w-40 h-40 object-contain mb-6" />

          <h1 className="text-4xl font-black text-white tracking-tight text-center"
            style={{ fontFamily: 'Georgia, serif', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
            Track me!
          </h1>
          <p className="text-sky-100 text-center mt-2 text-base max-w-xs font-medium">
            Track your internship hours and get certified every week 🎓
          </p>

          {/* How it works */}
          <div className="mt-8 bg-white/20 backdrop-blur px-6 py-5 rounded-2xl w-full max-w-xs">
            <p className="text-white text-xs uppercase tracking-widest mb-4 font-bold">
              ✨ How it works
            </p>
            <div className="space-y-3">
              {[
                { step: '01', text: 'Register your account' },
                { step: '02', text: 'Time in when you arrive' },
                { step: '03', text: 'Time out when you leave' },
                { step: '04', text: 'Download weekly certificate every Friday' },
              ].map(item => (
                <div key={item.step} className="flex items-center gap-3">
                  <span className="bg-white text-sky-500 font-black text-xs w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0">
                    {item.step}
                  </span>
                  <span className="text-white text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center px-8 py-12 bg-white overflow-y-auto">

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
            Create account
          </h2>
          <p className="text-slate-500 mb-8 text-base">Start tracking your OJT hours today.</p>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                Full Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handle}
                required
                placeholder="Juan Dela Cruz"
                className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-all text-sm"
              />
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Required Hours
                </label>
                <input
                  name="required_hours"
                  type="number"
                  value={form.required_hours}
                  onChange={handle}
                  min={1}
                  className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-400 transition-all text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                  Starting Hours
                </label>
                <input
                  name="starting_hours"
                  type="number"
                  value={form.starting_hours}
                  onChange={handle}
                  min={0}
                  className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-400 transition-all text-sm"
                />
              </div>
            </div>

            <div>
            <label className="text-sm font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
              Work End Time
            </label>
            <input
              name="auto_timeout_time"
              type="time"
              value={form.auto_timeout_time}
              onChange={handle}
              className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 focus:outline-none focus:border-sky-400 transition-all text-sm"
            />
            <p className="text-slate-400 text-xs mt-1">
              The system will auto time-out at this time if you forget.
            </p>
          </div>

            <div className="border-l-4 border-sky-400 bg-sky-50 px-4 py-3">
              <p className="text-sky-700 text-xs">
                💡 <span className="font-bold">Starting Hours</span> = hours already rendered before using this app. Leave as 0 if starting fresh.
              </p>
            </div>

            {success && (
              <div className="bg-green-50 border-l-4 border-green-500 px-4 py-3">
                <p className="text-green-600 text-sm font-medium">{success}</p>
              </div>
            )}
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
              {loading ? 'Creating account...' : '🚀 Create Account'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-slate-500 text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-500 font-bold hover:underline">
                Sign in
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
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { logsAPI } from '../api'
import logo from '../assets/logo-intern.png'

function fmt(ts) {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return '—'
  }
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
  })
}

function getWeekRange(offsetWeeks = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - offsetWeeks * 7)
  monday.setHours(0, 0, 0, 0)
  const friday = new Date(monday)
  friday.setDate(monday.getDate() + 4)
  friday.setHours(23, 59, 59, 999)
  return { monday, friday }
}

function isFriday() {
  return new Date().getDay() === 5
}

function getFutureWeeks() {
  const { monday, friday } = getWeekRange(0)
  return [{
    offset: 0,
    label: 'This Week',
    monday,
    friday,
  }]
}

function AttendanceCalendar({ logs, absentDates, onToggleAbsent }) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const attendedDates = new Set(logs.map(l => l.date))
  const absentSet = new Set(absentDates)
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1))
  const monthName = currentMonth.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const todayStr = new Date().toISOString().split('T')[0]

  const days = []
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const isWeekday = (y, m, d) => {
    const day = new Date(y, m, d).getDay()
    return day !== 0 && day !== 6
  }

  return (
    <div className="bg-white border-2 border-slate-100 p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-black text-slate-900 text-lg uppercase tracking-wider">
          📅 Attendance Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-500 transition-all font-bold">
            ‹
          </button>
          <span className="text-slate-700 text-sm font-bold min-w-[140px] text-center">{monthName}</span>
          <button onClick={nextMonth}
            className="w-8 h-8 flex items-center justify-center border-2 border-slate-200 text-slate-600 hover:border-sky-400 hover:text-sky-500 transition-all font-bold">
            ›
          </button>
        </div>
      </div>

      <p className="text-slate-400 text-xs mb-4">Tap today or a past weekday to mark/unmark as absent.</p>

      <div className="grid grid-cols-7 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-center text-slate-400 text-xs py-1 font-bold uppercase tracking-wider">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const isAttended = attendedDates.has(dateStr)
          const isAbsent = absentSet.has(dateStr)
          const isToday = dateStr === todayStr
          const isPastOrToday = dateStr <= todayStr && isWeekday(year, month, day)
          const isClickable = isPastOrToday && !isAttended
          const isWeekend = !isWeekday(year, month, day)

          let bg = 'transparent'
          let textColor = 'text-slate-400'
          let outline = 'none'

          if (isWeekend) {
            bg = 'rgba(148,163,184,0.1)'
            textColor = 'text-slate-300'
          } else if (isAttended) {
            bg = 'linear-gradient(135deg, #22c55e, #4ade80)'
            textColor = 'text-white'
          } else if (isAbsent) {
            bg = 'rgba(239,68,68,0.15)'
            textColor = 'text-red-500'
            outline = '2px solid #fca5a5'
          } else if (isToday) {
            bg = 'rgba(14,165,233,0.1)'
            textColor = 'text-sky-500'
            outline = '2px solid #0ea5e9'
          }

          return (
            <div
              key={dateStr}
              onClick={() => isClickable && onToggleAbsent(dateStr)}
              title={isClickable ? (isAbsent ? 'Click to unmark absent' : 'Click to mark as absent') : ''}
              className={`
                aspect-square flex items-center justify-center text-sm font-bold transition-all
                ${textColor}
                ${isClickable ? 'hover:opacity-70' : ''}
              `}
              style={{
                background: bg,
                outline,
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t-2 border-slate-100">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3" style={{ background: 'linear-gradient(135deg, #22c55e, #4ade80)' }} />
        <span className="text-slate-500 text-xs font-semibold">Present</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3" style={{ background: 'rgba(239,68,68,0.15)', outline: '2px solid #fca5a5' }} />
        <span className="text-slate-500 text-xs font-semibold">Absent</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-sky-400" style={{ background: 'rgba(14,165,233,0.1)' }} />
        <span className="text-slate-500 text-xs font-semibold">Today</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3" style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid #e2e8f0' }} />
        <span className="text-slate-500 text-xs font-semibold">Weekend</span>
      </div>
    </div>
    </div>
  )
}

function Navbar() {
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <nav className="bg-white border-b-2 border-slate-100 px-6 py-4 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="w-10 h-10 object-contain" />
          <span className="font-black text-slate-900 text-xl tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}>
            OJT Tracker
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-600 text-sm font-semibold">{user?.name}</span>
          </div>
          <button onClick={handleLogout}
            className="text-sm border-2 border-slate-200 text-slate-600 px-4 py-1.5 font-bold hover:border-sky-400 hover:text-sky-500 transition-all uppercase tracking-wider">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [today, setToday] = useState(null)
  const [logs, setLogs] = useState([])
  const [totalHours, setTotalHours] = useState(0)
  const [absentDates, setAbsentDates] = useState([])
  const [notes, setNotes] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(true)
  const [showCongrats, setShowCongrats] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showWeekPicker, setShowWeekPicker] = useState(false)
  const [selectedWeekOffset, setSelectedWeekOffset] = useState(0)
  const [certGenerating, setCertGenerating] = useState(false)
  const startingHours = Number(user?.starting_hours || 0)
  const requiredHours = Number(user?.required_hours || 486)
  const grandTotal = Number(Number(startingHours) + Number(totalHours) || 0)
  const pct = Number(Math.min(100, ((grandTotal / requiredHours) || 0) * 100)).toFixed(1)
  const remaining = Number(Math.max(0, requiredHours - grandTotal)).toFixed(2)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const refresh = useCallback(async () => {
    try {
      const [todayRes, logsRes, absentsRes] = await Promise.all([
        logsAPI.getToday(),
        logsAPI.getMyLogs(),
        logsAPI.getAbsents(),
      ])
      setToday(todayRes.data)
      setLogs(logsRes.data.logs)
      setTotalHours(Number(logsRes.data.totalHours || 0))
      setAbsentDates(absentsRes.data.dates)
    } catch (err) {
      console.error('Fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    if (grandTotal >= requiredHours && !loading) setShowCongrats(true)
  }, [grandTotal, requiredHours, loading])

  const handleTimeIn = async () => {
    setErr(''); setMsg('')
    try {
      await logsAPI.timeIn()
      setMsg('✅ Timed in successfully!')
      refresh()
    } catch (e) { setErr(e.response?.data?.error || 'Error') }
  }

  const handleTimeOut = async () => {
    setErr(''); setMsg('')
    try {
      await logsAPI.timeOut(notes)
      setMsg('✅ Timed out successfully!')
      setNotes('')
      refresh()
    } catch (e) { setErr(e.response?.data?.error || 'Error') }
  }

  const handleToggleAbsent = async (date) => {
    try {
      const res = await logsAPI.markAbsent(date)
      if (res.data.absent) {
        setAbsentDates(prev => [...prev, date])
      } else {
        setAbsentDates(prev => prev.filter(d => d !== date))
      }
    } catch (e) {
      console.error('Absent toggle error:', e)
    }
  }

  const generatePDF = async (htmlContent, filename) => {
    const { default: jsPDF } = await import('jspdf')
    const { default: html2canvas } = await import('html2canvas')
    const container = document.createElement('div')
    container.style.position = 'fixed'
    container.style.left = '-9999px'
    container.style.top = '0'
    container.style.width = '800px'
    container.innerHTML = htmlContent
    document.body.appendChild(container)
    await new Promise(r => setTimeout(r, 500))
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
    })
    document.body.removeChild(container)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    })
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
    pdf.save(filename)
  }

  const downloadWeeklyCert = async (offset = selectedWeekOffset) => {
    setCertGenerating(true)
    const { monday, friday } = getWeekRange(offset)
    const weekLogs = logs.filter(l => {
      const d = new Date(l.date)
      return d >= monday && d <= friday
    })
    const weekHours = weekLogs.reduce((sum, l) => sum + Number(l.hours_rendered || 0), 0)
    const daysPresent = weekLogs.length
    const htmlContent = `
      <div style="width:750px;background:white;border:8px solid #0ea5e9;padding:50px;text-align:center;position:relative;font-family:Georgia,serif;">
        <div style="position:absolute;inset:8px;border:2px solid #bae6fd;pointer-events:none;"></div>
        <img src="${logo}" alt="logo" style="width:80px;height:80px;object-fit:contain;margin:0 auto 5px;display:block;" />
        <div style="font-size:13px;color:#64748b;letter-spacing:4px;text-transform:uppercase;margin-bottom:25px;">OJT Tracker</div>
        <div style="font-size:34px;color:#0ea5e9;font-weight:bold;margin-bottom:6px;">Weekly Hours Certificate</div>
        <div style="font-size:13px;color:#94a3b8;margin-bottom:25px;letter-spacing:3px;text-transform:uppercase;">Certificate of Attendance</div>
        <div style="font-size:14px;color:#64748b;margin-bottom:8px;">This certifies that</div>
        <div style="font-size:38px;color:#0f172a;font-style:italic;border-bottom:3px solid #0ea5e9;display:inline-block;padding-bottom:6px;margin-bottom:25px;">${user?.name}</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:20px;background:#f0f9ff;padding:8px 20px;display:inline-block;">
          Week of ${monday.toLocaleDateString('en-PH', { month: 'long', day: 'numeric' })} – 
          ${friday.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style="background:#f0f9ff;padding:20px;margin:20px 0;display:grid;grid-template-columns:1fr 1fr 1fr;gap:15px;">
          <div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Days Present</div>
            <div style="font-size:24px;font-weight:bold;color:#0ea5e9;">${daysPresent} day${daysPresent !== 1 ? 's' : ''}</div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Hours This Week</div>
            <div style="font-size:24px;font-weight:bold;color:#0ea5e9;">${weekHours.toFixed(2)}h</div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Total OJT Hours</div>
            <div style="font-size:24px;font-weight:bold;color:#0ea5e9;">${grandTotal.toFixed(2)}h</div>
          </div>
        </div>
        <div style="margin-top:25px;font-size:12px;color:#94a3b8;">
          Generated on ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style="margin-top:5px;font-size:11px;color:#cbd5e1;">Developed by Ernesto • OJT Tracker</div>
      </div>
    `
    await generatePDF(htmlContent, `weekly-cert-${user?.name}-${monday.toISOString().split('T')[0]}.pdf`)
    setCertGenerating(false)
    setShowWeekPicker(false)
  }

  const downloadCompletionCert = async () => {
    setCertGenerating(true)
    const htmlContent = `
      <div style="width:800px;background:white;border:10px double #0ea5e9;padding:60px;text-align:center;position:relative;font-family:Georgia,serif;">
        <div style="position:absolute;inset:10px;border:1px solid #e0f2fe;pointer-events:none;"></div>
        <img src="${logo}" alt="logo" style="width:80px;height:80px;object-fit:contain;margin:0 auto 5px;display:block;" />
        <div style="font-size:12px;color:#64748b;letter-spacing:5px;text-transform:uppercase;margin-bottom:10px;">OJT Tracker</div>
        <div style="font-size:22px;color:#fbbf24;margin-bottom:20px;letter-spacing:5px;">★ ★ ★ ★ ★</div>
        <div style="font-size:44px;color:#0ea5e9;font-weight:bold;margin-bottom:8px;">Certificate of Completion</div>
        <div style="font-size:12px;color:#94a3b8;margin-bottom:35px;letter-spacing:4px;text-transform:uppercase;">On-the-Job Training</div>
        <div style="font-size:15px;color:#64748b;margin-bottom:10px;">This certificate is proudly presented to</div>
        <div style="font-size:50px;color:#0f172a;font-style:italic;margin-bottom:8px;">${user?.name}</div>
        <div style="width:320px;height:3px;background:linear-gradient(to right,transparent,#0ea5e9,transparent);margin:0 auto 30px;"></div>
        <div style="font-size:15px;color:#475569;line-height:1.9;max-width:500px;margin:0 auto 30px;">
          For successfully completing the required hours of On-the-Job Training and demonstrating 
          dedication, commitment, and professionalism throughout the internship program.
        </div>
        <div style="background:#f0f9ff;padding:25px;margin:20px auto;display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:380px;">
          <div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Total Hours Rendered</div>
            <div style="font-size:28px;font-weight:bold;color:#0ea5e9;">${grandTotal.toFixed(2)}h</div>
          </div>
          <div>
            <div style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-bottom:4px;">Required Hours</div>
            <div style="font-size:28px;font-weight:bold;color:#0ea5e9;">${requiredHours}h</div>
          </div>
        </div>
        <div style="font-size:17px;color:#0ea5e9;font-weight:bold;margin:20px 0;">🎉 Congratulations and best of luck in your career! 🎉</div>
        <div style="margin-top:30px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;">
          Completed on ${new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
        <div style="margin-top:6px;font-size:11px;color:#cbd5e1;">Developed by Ernesto • OJT Tracker</div>
      </div>
    `
    await generatePDF(htmlContent, `completion-cert-${user?.name}.pdf`)
    setCertGenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <img src={logo} alt="logo" className="w-16 h-16 object-contain mx-auto mb-4 animate-pulse" />
          <p className="text-slate-400 font-semibold">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navbar />

      {/* Congratulations Modal */}
      {showCongrats && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-sky-200 p-8 max-w-md w-full text-center"
            style={{ boxShadow: '0 20px 60px rgba(14,165,233,0.3)' }}>
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2"
              style={{ fontFamily: 'Georgia, serif' }}>
              Congratulations, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-slate-500 mb-6 text-sm leading-relaxed">
              You have successfully completed your OJT with{' '}
              <span className="text-sky-500 font-bold">{grandTotal.toFixed(2)} hours</span>{' '}
              rendered out of {requiredHours} required hours. You are now ready to graduate! 🎉
            </p>
            <button onClick={downloadCompletionCert}
              disabled={certGenerating}
              className="w-full text-white font-bold py-3 mb-3 transition-all text-sm uppercase tracking-widest"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
              {certGenerating ? '⏳ Generating PDF...' : '🎓 Download Completion Certificate'}
            </button>
            <button onClick={() => setShowCongrats(false)}
              className="w-full border-2 border-slate-200 text-slate-500 py-2.5 font-bold hover:border-slate-400 transition-all text-sm uppercase tracking-wider">
              Close
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Clock & Welcome */}
          <div className="bg-white border-2 border-slate-100 p-6"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 60%, #7dd3fc 100%)' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sky-100 text-sm font-medium mb-1">
                  {currentTime.toLocaleDateString('en-PH', {
                    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                  })}
                </p>
                <h2 className="text-3xl font-black text-white"
                  style={{ fontFamily: 'Georgia, serif' }}>
                  Welcome back, {user?.name?.split(' ')[0]}! 👋
                </h2>
                <p className="text-sky-100 text-sm mt-1">
                  {grandTotal.toFixed(2)}h completed · {remaining}h remaining
                </p>
              </div>
              <div className="text-center md:text-right">
                <div className="text-5xl font-black text-white font-mono tracking-tight">
                  {currentTime.toLocaleTimeString('en-PH', {
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                  })}
                </div>
                <p className="text-sky-200 text-xs mt-1 uppercase tracking-widest font-semibold">
                  Philippine Standard Time
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Hours', value: `${grandTotal.toFixed(1)}h`, color: '#0ea5e9' },
              { label: 'Required', value: `${requiredHours}h`, color: '#64748b' },
              { label: 'Remaining', value: `${remaining}h`, color: '#f59e0b' },
              { label: 'Progress', value: `${pct}%`, color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="bg-white border-2 border-slate-100 p-4 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="bg-white border-2 border-slate-100 p-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-slate-900 uppercase tracking-wider">OJT Progress</h3>
              <span className="text-white text-sm font-black px-3 py-1"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                {pct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 h-4">
              <div className="h-4 transition-all duration-700"
                style={{
                  width: `${pct}%`,
                  background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
                }} />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-slate-400 text-xs font-semibold">0h</span>
              <span className="text-slate-400 text-xs font-semibold">{requiredHours}h required</span>
            </div>
            {startingHours > 0 && (
              <p className="text-slate-400 text-xs mt-2">
                💡 Includes <span className="font-bold text-sky-500">{startingHours}h</span> starting hours
              </p>
            )}
            {grandTotal >= requiredHours && (
              <button onClick={() => setShowCongrats(true)}
                className="mt-4 w-full text-white font-bold py-3 transition-all text-sm uppercase tracking-widest"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                🎓 View Completion Certificate
              </button>
            )}
          </div>

          {/* Time In/Out */}
          <div className="bg-white border-2 border-slate-100 p-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider mb-5">
              🕐 Today's Attendance
            </h3>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { label: 'Time In', value: fmt(today?.time_in), color: '#0ea5e9' },
                { label: 'Time Out', value: fmt(today?.time_out), color: '#64748b' },
                { label: 'Hours', value: today?.hours_rendered ? `${Number(today.hours_rendered).toFixed(2)}h` : '—', color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="border-2 border-slate-100 p-4 text-center">
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{item.label}</p>
                  <p className="text-2xl font-black" style={{ color: item.color }}>{item.value}</p>
                </div>
              ))}
            </div>

            {!today && (
              new Date().getDay() === 0 || new Date().getDay() === 6 ? (
                <div className="border-2 border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-slate-400 font-semibold">🏖️ It's the weekend! No work today.</p>
                </div>
              ) : (
                <button onClick={handleTimeIn}
                  className="w-full text-white font-bold py-4 transition-all text-sm uppercase tracking-widest"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                  🟢 Time In Now
                </button>
              )
            )}
            
            {today && !today.time_out && (
              <div className="space-y-3">
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional: add notes for today..."
                  rows={2}
                  className="w-full border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 transition-all text-sm resize-none"
                />
                <button onClick={handleTimeOut}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 transition-all text-sm uppercase tracking-widest">
                  🔴 Time Out Now
                </button>
              </div>
            )}

            {today?.time_out && (
              <div className="border-2 border-sky-200 bg-sky-50 p-4 text-center">
                <p className="text-sky-600 font-bold">✅ Done for today! See you tomorrow.</p>
              </div>
            )}

            {msg && (
              <div className="mt-3 border-l-4 border-sky-400 bg-sky-50 px-4 py-3">
                <p className="text-sky-600 text-sm font-semibold">{msg}</p>
              </div>
            )}
            {err && (
              <div className="mt-3 border-l-4 border-red-500 bg-red-50 px-4 py-3">
                <p className="text-red-600 text-sm font-semibold">{err}</p>
              </div>
            )}
          </div>

          {/* Calendar */}
          <AttendanceCalendar
            logs={logs}
            absentDates={absentDates}
            onToggleAbsent={handleToggleAbsent}
          />

          {/* Weekly Certificate */}
          <div className="bg-white border-2 border-slate-100 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-wider mb-1">
                  📄 Weekly Certificate
                </h3>
                <p className="text-slate-500 text-sm">
                  Download your weekly hours certificate every Friday.
                </p>
                {!isFriday() && (
                  <p className="text-amber-500 text-xs font-semibold mt-1">
                    ⏳ Certificate is only available on Fridays.
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowWeekPicker(!showWeekPicker)}
                disabled={certGenerating || !isFriday()}
                className="px-6 py-3 font-bold text-sm uppercase tracking-widest transition-all text-white whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                📄 {certGenerating ? 'Generating...' : 'Download'}
              </button>
            </div>

            {showWeekPicker && isFriday() && (
              <div className="border-2 border-slate-100 bg-slate-50 p-4">
                <p className="text-slate-600 text-xs font-bold uppercase tracking-widest mb-3">
                  Current week:
                </p>
                <div className="space-y-2">
                  {getFutureWeeks().map(week => {
                    const weekLogs = logs.filter(l => {
                      const d = new Date(l.date)
                      return d >= week.monday && d <= week.friday
                    })
                    const weekHours = weekLogs.reduce((sum, l) => sum + Number(l.hours_rendered || 0), 0)
                    return (
                      <div
                        key={week.offset}
                        className="flex items-center justify-between p-3 border-2 border-sky-400 bg-sky-50"
                      >
                        <div>
                          <p className="text-slate-800 font-bold text-sm">{week.label}</p>
                          <p className="text-slate-400 text-xs mt-0.5">
                            {weekLogs.length} day{weekLogs.length !== 1 ? 's' : ''} present
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-sm" style={{ color: '#0ea5e9' }}>
                            {weekHours.toFixed(2)}h
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <button
                  onClick={() => downloadWeeklyCert(0)}
                  disabled={certGenerating}
                  className="mt-4 w-full text-white font-bold py-3 text-sm uppercase tracking-widest transition-all"
                  style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                  {certGenerating ? '⏳ Generating PDF...' : '📥 Download This Week as PDF'}
                </button>
              </div>
            )}
          </div>

          {/* Attendance History */}
          <div className="bg-white border-2 border-slate-100 p-6">
            <h3 className="font-black text-slate-900 uppercase tracking-wider mb-5">
              📋 Attendance History
            </h3>
            {logs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-slate-400 font-semibold">No attendance records yet.</p>
                <p className="text-slate-300 text-sm mt-1">Time in to start tracking!</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-4 px-3 py-2 bg-slate-50 text-xs text-slate-400 font-bold uppercase tracking-widest">
                  <span>Date</span>
                  <span>Time In</span>
                  <span>Time Out</span>
                  <span>Hours</span>
                </div>
                {logs.map(log => (
                  <div key={log.id} className="grid grid-cols-4 border-2 border-slate-100 px-3 py-3 text-sm hover:border-sky-200 transition-all">
                    <span className="text-slate-700 font-semibold">{fmtDate(log.date)}</span>
                    <span className="text-slate-600">{fmt(log.time_in)}</span>
                    <span className="text-slate-600">{fmt(log.time_out)}</span>
                    <span className="font-black" style={{ color: '#0ea5e9' }}>
                      {log.hours_rendered ? `${Number(log.hours_rendered).toFixed(2)}h` : '—'}
                    </span>
                  </div>
                ))}
                <div className="grid grid-cols-4 px-3 py-3 bg-sky-50 border-2 border-sky-200 text-sm font-black">
                  <span className="col-span-3 text-slate-600 uppercase tracking-wider">Total Hours</span>
                  <span style={{ color: '#0ea5e9' }}>{grandTotal.toFixed(2)}h</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-slate-300 text-xs pb-4">
            Developed by <span className="font-bold text-sky-400">Ernesto</span> • OJT Tracker
          </p>

        </div>
      </div>
    </>
  )
}
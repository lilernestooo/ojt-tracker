import { useState, useEffect } from 'react'
import { logsAPI, authAPI } from '../api'
import { useAuth } from '../hooks/useAuth'
import logo from '../assets/logo-intern.png'

function fmt(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-PH', {
    weekday: 'short', month: 'short', day: 'numeric'
  })
}

function Navbar() {
  const { user, logout } = useAuth()
  return (
    <nav className="bg-white border-b-2 border-slate-100 px-6 py-4 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="logo" className="w-10 h-10 object-contain" />
          <span className="font-black text-slate-900 text-xl tracking-tight"
            style={{ fontFamily: 'Georgia, serif' }}>
            Track me!
          </span>
          <span className="text-white text-xs font-black px-3 py-1 uppercase tracking-wider"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
            Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3">
            <div className="w-8 h-8 flex items-center justify-center text-white text-sm font-black"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-slate-600 text-sm font-semibold">{user?.name}</span>
          </div>
          <button onClick={() => { logout(); window.location.href = '/login' }}
            className="text-sm border-2 border-slate-200 text-slate-600 px-4 py-1.5 font-bold hover:border-sky-400 hover:text-sky-500 transition-all uppercase tracking-wider">
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default function AdminDashboard() {
  const [trainees, setTrainees] = useState([])
  const [selected, setSelected] = useState(null)
  const [traineeLogs, setTraineeLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [editErr, setEditErr] = useState('')

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Add trainee modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [addForm, setAddForm] = useState({
    name: '', email: '', password: '', required_hours: 486, starting_hours: 0
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addErr, setAddErr] = useState('')

  const fetchTrainees = () => {
    logsAPI.getAllTrainees()
      .then(res => setTrainees(res.data))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchTrainees() }, [])

  const viewLogs = async (trainee) => {
    setSelected(trainee)
    setActiveTab('logs')
    setLogsLoading(true)
    try {
      const res = await logsAPI.getTraineeLogs(trainee.id)
      setTraineeLogs(res.data)
    } finally {
      setLogsLoading(false)
    }
  }

  const openEdit = (t) => {
    setEditForm({
      id: t.id,
      name: t.name,
      email: t.email,
      required_hours: t.required_hours,
      starting_hours: t.starting_hours || 0,
    })
    setEditErr('')
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    setEditLoading(true)
    setEditErr('')
    try {
      await authAPI.updateUser(editForm.id, {
        name: editForm.name,
        email: editForm.email,
        required_hours: Number(editForm.required_hours),
        starting_hours: Number(editForm.starting_hours),
      })
      setShowEditModal(false)
      fetchTrainees()
      if (selected?.id === editForm.id) {
        setSelected(prev => ({ ...prev, ...editForm }))
      }
    } catch (err) {
      setEditErr(err.response?.data?.error || 'Update failed')
    } finally {
      setEditLoading(false)
    }
  }

  const openDelete = (t) => {
    setDeleteTarget(t)
    setShowDeleteModal(true)
  }

  const handleDelete = async () => {
    setDeleteLoading(true)
    try {
      await authAPI.deleteUser(deleteTarget.id)
      setShowDeleteModal(false)
      setDeleteTarget(null)
      if (selected?.id === deleteTarget.id) {
        setSelected(null)
        setTraineeLogs([])
      }
      fetchTrainees()
    } catch {
      alert('Failed to delete user')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAdd = async () => {
    setAddLoading(true)
    setAddErr('')
    try {
      await authAPI.register(addForm)
      setShowAddModal(false)
      setAddForm({ name: '', email: '', password: '', required_hours: 486, starting_hours: 0 })
      fetchTrainees()
    } catch (err) {
      setAddErr(err.response?.data?.error || 'Registration failed')
    } finally {
      setAddLoading(false)
    }
  }

 const pct = (t) => {
  const starting = Number(t.starting_hours || 0)
  const logged = Number(t.total_hours || 0)
  const required = Number(t.required_hours || 1)

  const total = starting + logged
  const percent = Math.min(100, (total / required) * 100)

  return Number(percent || 0).toFixed(0)
}

  const grandTotal = (t) => {
  const starting = Number(t.starting_hours || 0)
  const logged = Number(t.total_hours || 0)
  return (starting + logged).toFixed(2)
}

  const filtered = trainees.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const completed = trainees.filter(t => parseFloat(grandTotal(t)) >= t.required_hours).length
  const inProgress = trainees.filter(t => parseFloat(grandTotal(t)) < t.required_hours && parseFloat(t.total_hours) > 0).length
  const notStarted = trainees.filter(t => parseFloat(t.total_hours) === 0).length

  return (
    <>
      <Navbar />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-slate-100 p-8 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(14,165,233,0.2)' }}>
            <h3 className="font-black text-slate-900 text-xl mb-6 uppercase tracking-wider"
              style={{ fontFamily: 'Georgia, serif' }}>
              ✏️ Edit Trainee
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Email</label>
                <input
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Required Hours</label>
                  <input
                    type="number"
                    value={editForm.required_hours}
                    onChange={e => setEditForm(f => ({ ...f, required_hours: e.target.value }))}
                    className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Starting Hours</label>
                  <input
                    type="number"
                    value={editForm.starting_hours}
                    onChange={e => setEditForm(f => ({ ...f, starting_hours: e.target.value }))}
                    className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                  />
                </div>
              </div>
              {editErr && (
                <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
                  <p className="text-red-600 text-sm font-semibold">{editErr}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleEdit} disabled={editLoading}
                className="flex-1 text-white font-bold py-3 text-sm uppercase tracking-widest transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setShowEditModal(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 text-sm uppercase tracking-widest hover:border-slate-400 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-red-100 p-8 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(239,68,68,0.2)' }}>
            <div className="text-4xl text-center mb-4">⚠️</div>
            <h3 className="font-black text-slate-900 text-xl mb-2 text-center uppercase tracking-wider">
              Delete Trainee
            </h3>
            <p className="text-slate-500 text-center text-sm mb-6">
              Are you sure you want to delete{' '}
              <span className="font-bold text-slate-900">{deleteTarget?.name}</span>?
              This will permanently remove their account and all attendance records.
            </p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 text-sm uppercase tracking-widest transition-all">
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button onClick={() => setShowDeleteModal(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 text-sm uppercase tracking-widest hover:border-slate-400 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Trainee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white border-2 border-slate-100 p-8 w-full max-w-md"
            style={{ boxShadow: '0 20px 60px rgba(14,165,233,0.2)' }}>
            <h3 className="font-black text-slate-900 text-xl mb-6 uppercase tracking-wider"
              style={{ fontFamily: 'Georgia, serif' }}>
              ➕ Add Trainee
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Full Name</label>
                <input
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Juan Dela Cruz"
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Email</label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="juan@school.edu"
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Password</label>
                <input
                  type="password"
                  value={addForm.password}
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Required Hours</label>
                  <input
                    type="number"
                    value={addForm.required_hours}
                    onChange={e => setAddForm(f => ({ ...f, required_hours: Number(e.target.value) }))}
                    className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">Starting Hours</label>
                  <input
                    type="number"
                    value={addForm.starting_hours}
                    onChange={e => setAddForm(f => ({ ...f, starting_hours: Number(e.target.value) }))}
                    className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 focus:outline-none focus:border-sky-400 text-sm"
                  />
                </div>
              </div>
              {addErr && (
                <div className="border-l-4 border-red-500 bg-red-50 px-4 py-2">
                  <p className="text-red-600 text-sm font-semibold">{addErr}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleAdd} disabled={addLoading}
                className="flex-1 text-white font-bold py-3 text-sm uppercase tracking-widest transition-all"
                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                {addLoading ? 'Adding...' : 'Add Trainee'}
              </button>
              <button onClick={() => setShowAddModal(false)}
                className="flex-1 border-2 border-slate-200 text-slate-600 font-bold py-3 text-sm uppercase tracking-widest hover:border-slate-400 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)', padding: '24px' }}>
            <div>
              <h2 className="text-3xl font-black text-white"
                style={{ fontFamily: 'Georgia, serif' }}>
                Admin Dashboard
              </h2>
              <p className="text-sky-100 text-sm mt-1">
                {trainees.length} trainee{trainees.length !== 1 ? 's' : ''} registered
              </p>
            </div>
            <button onClick={() => setShowAddModal(true)}
              className="bg-white font-black text-sm px-6 py-3 uppercase tracking-widest transition-all hover:bg-sky-50"
              style={{ color: '#0ea5e9' }}>
              ➕ Add Trainee
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Trainees', value: trainees.length, color: '#0ea5e9' },
              { label: 'Completed', value: completed, color: '#10b981' },
              { label: 'In Progress', value: inProgress, color: '#f59e0b' },
              { label: 'Not Started', value: notStarted, color: '#94a3b8' },
            ].map(s => (
              <div key={s.label} className="bg-white border-2 border-slate-100 p-5 text-center">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">{s.label}</p>
                <p className="text-4xl font-black" style={{ color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-slate-200 bg-white">
            {[
              { id: 'overview', label: '👥 Trainees' },
              { id: 'logs', label: '📋 Attendance Logs' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 font-black text-sm uppercase tracking-widest transition-all border-b-4 ${
                  activeTab === tab.id
                    ? 'border-sky-400 text-sky-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="bg-white border-2 border-slate-100">
              {/* Search */}
              <div className="p-4 border-b-2 border-slate-100">
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search by name or email..."
                  className="w-full border-2 border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-400 text-sm"
                />
              </div>

              {/* Table */}
              {loading ? (
                <div className="p-12 text-center">
                  <p className="text-slate-400 font-semibold">Loading trainees...</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-4xl mb-3">📭</p>
                  <p className="text-slate-400 font-semibold">No trainees found.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-100">
                        {['Name', 'Email', 'Progress', 'Hours', 'Status', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((t, idx) => (
                        <tr key={t.id}
                          className={`border-b border-slate-100 hover:bg-sky-50 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 flex items-center justify-center text-white text-sm font-black flex-shrink-0"
                                style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                                {t.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                                <p className="text-slate-400 text-xs">{t.days_attended} days attended</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-slate-600 text-sm">{t.email}</p>
                          </td>
                          <td className="px-4 py-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-slate-100 h-2">
                                <div className="h-2 transition-all"
                                  style={{
                                    width: `${pct(t)}%`,
                                    background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
                                  }} />
                              </div>
                              <span className="text-xs font-black text-slate-600">{pct(t)}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <p className="font-black text-sm" style={{ color: '#0ea5e9' }}>
                              {grandTotal(t)}h
                            </p>
                            <p className="text-slate-400 text-xs">of {t.required_hours}h</p>
                          </td>
                          <td className="px-4 py-4">
                            {parseFloat(grandTotal(t)) >= t.required_hours ? (
                              <span className="bg-emerald-100 text-emerald-700 text-xs font-black px-3 py-1 uppercase tracking-wider">
                                ✅ Complete
                              </span>
                            ) : parseFloat(t.total_hours) > 0 ? (
                              <span className="bg-sky-100 text-sky-600 text-xs font-black px-3 py-1 uppercase tracking-wider">
                                🔄 In Progress
                              </span>
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-xs font-black px-3 py-1 uppercase tracking-wider">
                                ⏳ Not Started
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <button onClick={() => viewLogs(t)}
                                className="border-2 border-sky-200 text-sky-500 text-xs font-bold px-3 py-1.5 hover:bg-sky-50 transition-all uppercase tracking-wider">
                                View
                              </button>
                              <button onClick={() => openEdit(t)}
                                className="border-2 border-amber-200 text-amber-500 text-xs font-bold px-3 py-1.5 hover:bg-amber-50 transition-all uppercase tracking-wider">
                                Edit
                              </button>
                              <button onClick={() => openDelete(t)}
                                className="border-2 border-red-200 text-red-500 text-xs font-bold px-3 py-1.5 hover:bg-red-50 transition-all uppercase tracking-wider">
                                Del
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="bg-white border-2 border-slate-100">
              {!selected ? (
                <div className="p-16 text-center">
                  <p className="text-5xl mb-4">👆</p>
                  <p className="text-slate-500 font-bold text-lg">Select a trainee first</p>
                  <p className="text-slate-400 text-sm mt-1">Go to the Trainees tab and click "View" on any trainee</p>
                </div>
              ) : (
                <>
                  {/* Selected trainee info */}
                  <div className="p-6 border-b-2 border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex items-center justify-center text-white text-lg font-black"
                        style={{ background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)' }}>
                        {selected.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg">{selected.name}</h3>
                        <p className="text-slate-400 text-sm">{selected.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-black" style={{ color: '#0ea5e9' }}>{grandTotal(selected)}h</p>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Rendered</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-slate-600">{selected.required_hours}h</p>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Required</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-black text-emerald-500">{pct(selected)}%</p>
                        <p className="text-slate-400 text-xs uppercase tracking-wider">Progress</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="px-6 py-3 bg-slate-50 border-b-2 border-slate-100">
                    <div className="w-full bg-slate-200 h-3">
                      <div className="h-3 transition-all"
                        style={{
                          width: `${pct(selected)}%`,
                          background: 'linear-gradient(135deg, #0ea5e9, #38bdf8)'
                        }} />
                    </div>
                  </div>

                  {/* Logs table */}
                  {logsLoading ? (
                    <div className="p-12 text-center">
                      <p className="text-slate-400 font-semibold">Loading logs...</p>
                    </div>
                  ) : traineeLogs.length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-4xl mb-3">📭</p>
                      <p className="text-slate-400 font-semibold">No attendance records yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-slate-50 border-b-2 border-slate-100">
                            {['Date', 'Time In', 'Time Out', 'Hours Rendered', 'Notes'].map(h => (
                              <th key={h} className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {traineeLogs.map((log, idx) => (
                            <tr key={log.id}
                              className={`border-b border-slate-100 hover:bg-sky-50 transition-all ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
                              <td className="px-4 py-3 font-semibold text-slate-700 text-sm">{fmtDate(log.date)}</td>
                              <td className="px-4 py-3 text-slate-600 text-sm">{fmt(log.time_in)}</td>
                              <td className="px-4 py-3 text-slate-600 text-sm">{fmt(log.time_out)}</td>
                              <td className="px-4 py-3">
                                <span className="font-black text-sm" style={{ color: '#0ea5e9' }}>
                                  {log.hours_rendered ? `${Number(log.hours_rendered).toFixed(2)}h` : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-slate-400 text-sm">{log.notes || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-sky-50 border-t-2 border-sky-200">
                            <td colSpan={3} className="px-4 py-3 font-black text-slate-700 uppercase tracking-wider text-sm">
                              Total Hours
                            </td>
                            <td className="px-4 py-3 font-black text-lg" style={{ color: '#0ea5e9' }}>
                              {grandTotal(selected)}h
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="text-center text-slate-300 text-xs pb-4">
            Developed by <span className="font-bold text-sky-400">Ernesto</span> • Track me!
          </p>

        </div>
      </div>
    </>
  )
}
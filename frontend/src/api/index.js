import axios from 'axios'

const api = axios.create({
  baseURL: 'https://ojt-tracker-r318.onrender.com/api'
})

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token')
  if (token) {
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  updateUser: (id, data) => api.put(`/auth/users/${id}`, data),
  deleteUser: (id) => api.delete(`/auth/users/${id}`)
}

export const logsAPI = {
  timeIn: () => api.post('/logs/time-in'),
  timeOut: (notes) => api.post('/logs/time-out', { notes }),
  getMyLogs: () => api.get('/logs/my-logs'),
  getToday: () => api.get('/logs/today'),
  getAllTrainees: () => api.get('/logs/trainees'),
  getTraineeLogs: (id) => api.get(`/logs/trainees/${id}/logs`),
  markAbsent: (date) => api.post('/logs/absent', { date }),
  getAbsents: () => api.get('/logs/absents')
}
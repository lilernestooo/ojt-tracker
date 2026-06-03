const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  timeIn, timeOut, getMyLogs, getTodayLog,
  getAllTrainees, getTraineeLogs,
  markAbsent, getAbsents,
  runAutoTimeout,
} = require('../controllers/logs.controller');

// ── Cron (no auth — secured by CRON_SECRET header instead) ──
router.post('/auto-timeout', runAutoTimeout);

// ── Trainee routes ──
router.post('/time-in', authenticate, timeIn);
router.post('/time-out', authenticate, timeOut);
router.get('/my-logs', authenticate, getMyLogs);
router.get('/today', authenticate, getTodayLog);
router.post('/absent', authenticate, markAbsent);
router.get('/absents', authenticate, getAbsents);

// ── Admin routes ──
router.get('/trainees', authenticate, adminOnly, getAllTrainees);
router.get('/trainees/:id/logs', authenticate, adminOnly, getTraineeLogs);

module.exports = router;
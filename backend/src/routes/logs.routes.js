const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  timeIn, timeOut, getMyLogs, getTodayLog,
  getAllTrainees, getTraineeLogs,
  markAbsent, getAbsents,
} = require('../controllers/logs.controller');

router.post('/time-in', authenticate, timeIn);
router.post('/time-out', authenticate, timeOut);
router.get('/my-logs', authenticate, getMyLogs);
router.get('/today', authenticate, getTodayLog);
router.get('/trainees', authenticate, adminOnly, getAllTrainees);
router.get('/trainees/:id/logs', authenticate, adminOnly, getTraineeLogs);

router.post('/absent', authenticate, markAbsent);
router.get('/absents', authenticate, getAbsents);

module.exports = router;
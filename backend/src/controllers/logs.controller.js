const { db } = require('../db');

const logsCol = db.collection('time_logs');
const usersCol = db.collection('users');
const absentsCol = db.collection('absents');

const timeIn = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  // Block weekends (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(400).json({ error: 'Cannot time in on weekends' });
  }

  try {
    const existing = await logsCol
      .where('user_id', '==', userId)
      .where('date', '==', today)
      .limit(1).get();

    if (!existing.empty) return res.status(409).json({ error: 'Already timed in today' });

    const docRef = await logsCol.add({
      user_id: userId,
      date: today,
      time_in: new Date().toISOString(),
      time_out: null,
      hours_rendered: 0,
      notes: null,
      created_at: new Date().toISOString(),
    });

    const doc = await docRef.get();
    res.status(201).json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const timeOut = async (req, res) => {
  const userId = req.user.id;
  const { notes } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  try {
    const snap = await logsCol
      .where('user_id', '==', userId)
      .where('date', '==', today)
      .limit(1).get();

    if (snap.empty) return res.status(404).json({ error: 'No time-in record for today' });

    const doc = snap.docs[0];
    const data = doc.data();
    if (data.time_out) return res.status(409).json({ error: 'Already timed out today' });

    const hours = ((now - new Date(data.time_in)) / 3600000).toFixed(2);

    await doc.ref.update({
      time_out: now.toISOString(),
      hours_rendered: parseFloat(hours),
      notes: notes || null,
    });

    const updated = await doc.ref.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyLogs = async (req, res) => {
  const userId = req.user.id;
  try {
    const snap = await logsCol
      .where('user_id', '==', userId)
      .orderBy('date', 'desc')
      .get();

    const logs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const totalHours = logs.reduce((sum, l) => sum + (l.hours_rendered || 0), 0);

    res.json({ logs, totalHours: parseFloat(totalHours.toFixed(2)) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTodayLog = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];
  try {
    const snap = await logsCol
      .where('user_id', '==', userId)
      .where('date', '==', today)
      .limit(1).get();

    res.json(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllTrainees = async (req, res) => {
  try {
    const usersSnap = await usersCol.where('role', '==', 'trainee').get();
    const logsSnap = await logsCol.get();
    const allLogs = logsSnap.docs.map(d => d.data());

    const trainees = usersSnap.docs.map(doc => {
      const u = doc.data();
      const userLogs = allLogs.filter(l => l.user_id === doc.id);
      const total_hours = userLogs.reduce((sum, l) => sum + (l.hours_rendered || 0), 0);
      return {
        id: doc.id,
        name: u.name,
        email: u.email,
        company: u.company,
        required_hours: u.required_hours,
        total_hours: parseFloat(total_hours.toFixed(2)),
        days_attended: userLogs.length,
      };
    });

    trainees.sort((a, b) => a.name.localeCompare(b.name));
    res.json(trainees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTraineeLogs = async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await logsCol
      .where('user_id', '==', id)
      .orderBy('date', 'desc')
      .get();

    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Toggle absent — weekdays only (today and past), no future dates, no weekends
const markAbsent = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!date) return res.status(400).json({ error: 'Date is required' });

  // Block future dates only
  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: 'Cannot mark future dates as absent' });

  // Block weekends (0 = Sunday, 6 = Saturday)
  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.status(400).json({ error: 'Cannot mark weekends as absent' });
  }

  // Block if user already has a time log on that date (they attended)
  try {
    const existing = await logsCol
      .where('user_id', '==', userId)
      .where('date', '==', date)
      .limit(1).get();

    if (!existing.empty) return res.status(409).json({ error: 'You already have a time log on this date' });

    const absentRef = absentsCol.doc(`${userId}_${date}`);
    const snap = await absentRef.get();

    if (snap.exists) {
      // Toggle off — unmark absent
      await absentRef.delete();
      return res.json({ absent: false, date });
    } else {
      // Toggle on — mark absent
      await absentRef.set({
        user_id: userId,
        date,
        created_at: new Date().toISOString(),
      });
      return res.json({ absent: true, date });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Get all absent dates for current userss
const getAbsents = async (req, res) => {
  const userId = req.user.id;
  try {
    const snap = await absentsCol
      .where('user_id', '==', userId)
      .get();

    const dates = snap.docs.map(d => d.data().date);
    res.json({ dates });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  timeIn, timeOut, getMyLogs, getTodayLog,
  getAllTrainees, getTraineeLogs,
  markAbsent, getAbsents,
};
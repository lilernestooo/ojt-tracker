const pool = require('../db');

const timeIn = async (req, res) => {
  const userId = req.user.id;
  const today = new Date().toISOString().split('T')[0];

  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6)
    return res.status(400).json({ error: 'Cannot time in on weekends' });

  try {
    const existing = await pool.query(
      'SELECT id FROM time_logs WHERE user_id=$1 AND date=$2',
      [userId, today]
    );
    if (existing.rows.length) return res.status(409).json({ error: 'Already timed in today' });

    const result = await pool.query(
      `INSERT INTO time_logs (user_id, date, time_in, time_out, hours_rendered, notes)
       VALUES ($1, $2, NOW(), NULL, 0, NULL)
       RETURNING *`,
      [userId, today]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const timeOut = async (req, res) => {
  const userId = req.user.id;
  const { notes } = req.body;
  const today = new Date().toISOString().split('T')[0];

  try {
    const snap = await pool.query(
      'SELECT * FROM time_logs WHERE user_id=$1 AND date=$2',
      [userId, today]
    );
    if (!snap.rows.length) return res.status(404).json({ error: 'No time-in record for today' });

    const log = snap.rows[0];
    if (log.time_out) return res.status(409).json({ error: 'Already timed out today' });

    const hours = ((new Date() - new Date(log.time_in)) / 3600000).toFixed(2);

    const result = await pool.query(
      `UPDATE time_logs
       SET time_out=NOW(), hours_rendered=$1, notes=$2
       WHERE id=$3
       RETURNING *`,
      [parseFloat(hours), notes || null, log.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getMyLogs = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT * FROM time_logs WHERE user_id=$1 ORDER BY date DESC',
      [userId]
    );
    const logs = result.rows;
    const totalHours = logs.reduce((sum, l) => sum + parseFloat(l.hours_rendered || 0), 0);
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
    const result = await pool.query(
      'SELECT * FROM time_logs WHERE user_id=$1 AND date=$2',
      [userId, today]
    );
    res.json(result.rows.length ? result.rows[0] : null);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const getAllTrainees = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         u.id, u.name, u.email, u.company, u.required_hours,
         COALESCE(SUM(l.hours_rendered), 0)::NUMERIC(8,2) AS total_hours,
         COUNT(l.id)::INT AS days_attended
       FROM users u
       LEFT JOIN time_logs l ON l.user_id = u.id
       WHERE u.role = 'trainee'
       GROUP BY u.id
       ORDER BY u.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getTraineeLogs = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM time_logs WHERE user_id=$1 ORDER BY date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const markAbsent = async (req, res) => {
  const userId = req.user.id;
  const { date } = req.body;

  if (!date) return res.status(400).json({ error: 'Date is required' });

  const today = new Date().toISOString().split('T')[0];
  if (date > today) return res.status(400).json({ error: 'Cannot mark future dates as absent' });

  const dayOfWeek = new Date(date).getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6)
    return res.status(400).json({ error: 'Cannot mark weekends as absent' });

  try {
    const existing = await pool.query(
      'SELECT id FROM time_logs WHERE user_id=$1 AND date=$2',
      [userId, date]
    );
    if (existing.rows.length)
      return res.status(409).json({ error: 'You already have a time log on this date' });

    const snap = await pool.query(
      'SELECT id FROM absents WHERE user_id=$1 AND date=$2',
      [userId, date]
    );

    if (snap.rows.length) {
      await pool.query('DELETE FROM absents WHERE user_id=$1 AND date=$2', [userId, date]);
      return res.json({ absent: false, date });
    } else {
      await pool.query(
        'INSERT INTO absents (user_id, date) VALUES ($1, $2)',
        [userId, date]
      );
      return res.json({ absent: true, date });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const getAbsents = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      'SELECT date FROM absents WHERE user_id=$1',
      [userId]
    );
    const dates = result.rows.map(r =>
      r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date
    );
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
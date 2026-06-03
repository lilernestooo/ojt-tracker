const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const register = async (req, res) => {
  const { name, email, password, company, required_hours, starting_hours, auto_timeout_time } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role, required_hours, starting_hours, company, auto_timeout_time)
       VALUES ($1, $2, $3, 'trainee', $4, $5, $6, $7)
       RETURNING id, name, email, role, required_hours, starting_hours, company, auto_timeout_time`,
      [
        name, email, hashed,
        required_hours || 486,
        starting_hours || 0,
        company || null,
        auto_timeout_time || '17:00:00',
      ]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: 'trainee' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const data = result.rows[0];
    if (!(await bcrypt.compare(password, data.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      required_hours: data.required_hours,
      starting_hours: data.starting_hours,
      company: data.company,
      auto_timeout_time: data.auto_timeout_time, // ← include in login response
    };

    const token = jwt.sign({ id: data.id, role: data.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, role, required_hours, starting_hours, company,
              auto_timeout_time, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, required_hours, starting_hours, auto_timeout_time } = req.body;
  try {
    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, required_hours=$3, starting_hours=$4, auto_timeout_time=$5
       WHERE id=$6
       RETURNING id, name, email, role, required_hours, starting_hours, company,
                 auto_timeout_time, created_at`,
      [name, email, Number(required_hours), Number(starting_hours), auto_timeout_time || '17:00:00', id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { register, login, me, updateUser, deleteUser };
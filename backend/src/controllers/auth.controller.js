const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db');

const usersCol = db.collection('users');

const register = async (req, res) => {
  const { name, email, password, company, required_hours, starting_hours } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'Name, email and password are required' });

  try {
    const existing = await usersCol.where('email', '==', email).limit(1).get();
    if (!existing.empty) return res.status(409).json({ error: 'Email already in use' });

    const hashed = await bcrypt.hash(password, 10);
    const docRef = await usersCol.add({
      name,
      email,
      password: hashed,
      role: 'trainee',
      required_hours: required_hours || 486,
      starting_hours: starting_hours || 0,
      company: company || null,
      created_at: new Date().toISOString(),
    });

    const user = {
      id: docRef.id,
      name,
      email,
      role: 'trainee',
      required_hours: required_hours || 486,
      starting_hours: starting_hours || 0,
      company: company || null,
    };

    const token = jwt.sign({ id: docRef.id, role: 'trainee' }, process.env.JWT_SECRET, { expiresIn: '7d' });
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
    const snap = await usersCol.where('email', '==', email).limit(1).get();
    if (snap.empty) return res.status(401).json({ error: 'Invalid credentials' });

    const doc = snap.docs[0];
    const data = doc.data();

    if (!(await bcrypt.compare(password, data.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    const user = {
      id: doc.id,
      name: data.name,
      email: data.email,
      role: data.role,
      required_hours: data.required_hours,
      starting_hours: data.starting_hours || 0,
      company: data.company,
    };

    const token = jwt.sign({ id: doc.id, role: data.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

const me = async (req, res) => {
  try {
    const doc = await usersCol.doc(req.user.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'User not found' });
    const data = doc.data();
    const { password: _, ...safe } = data;
    res.json({ id: doc.id, ...safe });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

const updateUser = async (req, res) => {
    const { id } = req.params
    const { name, email, required_hours, starting_hours } = req.body
    try {
      await usersCol.doc(id).update({
        name,
        email,
        required_hours: Number(required_hours),
        starting_hours: Number(starting_hours),
      })
      const doc = await usersCol.doc(id).get()
      const { password: _, ...safe } = doc.data()
      res.json({ id: doc.id, ...safe })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server error' })
    }
  }
  
  const deleteUser = async (req, res) => {
    const { id } = req.params
    try {
      // Delete all logs for this user
      const logs = await db.collection('time_logs').where('user_id', '==', id).get()
      const batch = db.batch()
      logs.docs.forEach(doc => batch.delete(doc.ref))
      await batch.commit()
      // Delete user
      await usersCol.doc(id).delete()
      res.json({ success: true })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Server error' })
    }
  }

  module.exports = { register, login, me, updateUser, deleteUser }
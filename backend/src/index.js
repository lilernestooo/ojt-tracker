require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const logsRoutes = require('./routes/logs.routes');
const pool = require('./db'); // initialize PostgreSQL connection

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  try {
    await pool.query('SELECT 1'); // test PostgreSQL connection
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }

  console.log(`🚀 Server running on port ${PORT}`);
});
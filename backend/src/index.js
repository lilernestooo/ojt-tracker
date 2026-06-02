require('dotenv').config();
const express = require('express');
const cors = require('cors');
const setup = require('./db/setup');

const authRoutes = require('./routes/auth.routes');
const logsRoutes = require('./routes/logs.routes');
const pool = require('./db');

const app = express();

// ✅ Fixed CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.options('*', cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/logs', logsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  let retries = 5;
  while (retries) {
    try {
      await pool.query('SELECT 1');
      console.log('✅ PostgreSQL connected');
      await setup();
      break;
    } catch (err) {
      retries -= 1;
      console.error(`❌ DB connection failed, retries left: ${retries}`, err.message);
      if (retries === 0) {
        console.error('❌ Could not connect to database after 5 attempts');
        break;
      }
      await new Promise(res => setTimeout(res, 5000));
    }
  }
});
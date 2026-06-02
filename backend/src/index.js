require('dotenv').config();
const express = require('express');
const cors = require('cors');

require('./db');

const app = express();

// ✅ FIXED CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CLIENT_URL, // your Vercel URL from Render env vars
].filter(Boolean); // removes undefined if CLIENT_URL is not set

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (Postman, mobile apps, etc.)
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

// ✅ Handle preflight requests for ALL routes
app.options('*', cors());

app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/logs', require('./routes/logs.routes'));

app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
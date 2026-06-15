require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./index');
const fs = require('fs');
const path = require('path');

async function setup() {
  try {
    // Run migrations
    const sql = fs.readFileSync(path.join(__dirname, 'migrate.sql'), 'utf8');
    await pool.query(sql);
    console.log('✅ Migrations done!');

    // Seed admin
    const email    = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name     = process.env.ADMIN_NAME;

    if (!email || !password || !name) {
      console.warn('⚠️ Skipping admin seed — ADMIN_EMAIL, ADMIN_NAME, or ADMIN_PASSWORD not set in .env');
      return;
    }

    const hashed = await bcrypt.hash(password, 10);
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);

    if (existing.rows.length) {
      await pool.query(
        'UPDATE users SET role=$1, password=$2 WHERE email=$3',
        ['admin', hashed, email]
      );
      console.log('✅ Admin updated!');
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, role, required_hours, starting_hours, company)
         VALUES ($1, $2, $3, 'admin', 0, 0, NULL)`,
        [name, email, hashed]
      );
      console.log('✅ Admin created!');
    }
  } catch (err) {
    console.error('❌ Setup error:', err.message);
  }
}

module.exports = setup;
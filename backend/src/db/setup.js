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
    const email = 'Ernesto@dev.com';
    const password = 'admin022704';
    const name = 'Ernesto';
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
  // ✅ NO pool.end() here — keeps connection alive for the server
}

module.exports = setup;
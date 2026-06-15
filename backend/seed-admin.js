require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/db');

async function seedAdmin() {
  const email    = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const name     = process.env.ADMIN_NAME;

  if (!email || !password || !name) {
    console.error('❌ Missing ADMIN_EMAIL, ADMIN_NAME, or ADMIN_PASSWORD in .env');
    process.exit(1);
  }

  try {
    const hashed   = await bcrypt.hash(password, 10);
    const existing = await pool.query('SELECT id FROM users WHERE email=$1', [email]);

    if (existing.rows.length) {
      await pool.query(
        'UPDATE users SET role=$1, password=$2 WHERE email=$3',
        ['admin', hashed, email]
      );
      console.log('✅ Existing user updated to admin!');
    } else {
      await pool.query(
        `INSERT INTO users (name, email, password, role, required_hours, starting_hours, company)
         VALUES ($1, $2, $3, 'admin', 0, 0, NULL)`,
        [name, email, hashed]
      );
      console.log('✅ Admin created!');
    }

    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedAdmin();
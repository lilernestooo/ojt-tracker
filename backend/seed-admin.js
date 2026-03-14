require('dotenv').config();
const bcrypt = require('bcryptjs');
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require(path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT));
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function seedAdmin() {
  const email = 'Ernesto@dev.com';
  const password = 'admin022704';
  const name = 'Ernesto';

  try {
    const existing = await db.collection('users').where('email', '==', email).limit(1).get();
    const hashed = await bcrypt.hash(password, 10);

    if (!existing.empty) {
      await existing.docs[0].ref.update({ role: 'admin', password: hashed });
      console.log('✅ Existing user updated to admin!');
    } else {
      await db.collection('users').add({
        name, email, password: hashed,
        role: 'admin', required_hours: 0,
        company: null, created_at: new Date().toISOString(),
      });
      console.log('✅ Admin created!');
    }
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
  } finally {
    process.exit(0);
  }
}

seedAdmin();
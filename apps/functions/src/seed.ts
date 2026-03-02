import { getAuth } from 'firebase-admin/auth';
import { db } from './firebase';

const users = [
  { email: 'admin@example.com', role: 'ADMIN', password: 'PLACEHOLDER_ADMIN_PASSWORD' },
  { email: 'sales@example.com', role: 'SALES', password: 'PLACEHOLDER_SALES_PASSWORD' },
  { email: 'tech@example.com', role: 'TECH', password: 'PLACEHOLDER_TECH_PASSWORD' },
  { email: 'install@example.com', role: 'INSTALL', password: 'PLACEHOLDER_INSTALL_PASSWORD' },
  { email: 'accounting@example.com', role: 'ACCOUNTING', password: 'PLACEHOLDER_ACCOUNTING_PASSWORD' }
];

async function run() {
  const auth = getAuth();
  for (const u of users) {
    let record;
    try {
      record = await auth.getUserByEmail(u.email);
    } catch {
      record = await auth.createUser({ email: u.email, password: u.password });
    }
    await auth.setCustomUserClaims(record.uid, { role: u.role });
    await db.collection('users').doc(record.uid).set({ email: u.email, role: u.role }, { merge: true });
  }

  await db.collection('projects').doc('demo-1').set({ name: 'Solar Alpha', status: 'LEAD' });
  await db.collection('projects').doc('demo-2').set({ name: 'Storage Beta', status: 'QUALIFIED' });
  await db.collection('projects').doc('demo-3').set({ name: 'Retrofit Gamma', status: 'SCHEDULED' });

  console.log('Seed complete');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function readJsonFile(filename) {
  const filePath = path.join(__dirname, 'data', filename);
  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${filename}: file not found.`);
    return [];
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filename}:`, err.message);
    return [];
  }
}

async function migrate() {
  console.log('Starting migration from local JSON files to Neon database...\n');

  // 1. Migrate Admins
  const admins = readJsonFile('admins.json');
  let adminCount = 0;
  for (const admin of admins) {
    const hash = admin.passwordHash || admin.password || '';
    if (admin.username && hash) {
      const res = await pool.query(
        `INSERT INTO admins (username, "passwordHash", "gymId")
         VALUES ($1, $2, $3)
         ON CONFLICT (username) DO NOTHING`,
        [admin.username, hash, admin.gymId || 'gym_001']
      );
      if (res.rowCount > 0) adminCount++;
    }
  }
  console.log(`- Admins migrated: ${adminCount} of ${admins.length}`);

  // 2. Migrate Plans
  const plans = readJsonFile('plans.json');
  let planCount = 0;
  for (const plan of plans) {
    if (plan.id && plan.planName) {
      const res = await pool.query(
        `INSERT INTO plans 
          (id, "gymId", "planName", "monthlyPrice", "signupFee", "yearlyFee", "stripePriceId", "stripeSignupPriceId", "stripeYearlyPriceId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          plan.id,
          plan.gymId || 'gym_001',
          plan.planName,
          parseFloat(plan.monthlyPrice) || 0,
          parseFloat(plan.signupFee) || 0,
          parseFloat(plan.yearlyFee) || 0,
          plan.stripePriceId || null,
          plan.stripeSignupPriceId || null,
          plan.stripeYearlyPriceId || null,
        ]
      );
      if (res.rowCount > 0) planCount++;
    }
  }
  console.log(`- Plans migrated: ${planCount} of ${plans.length}`);

  // 3. Migrate Members
  const members = readJsonFile('members.json');
  let memberCount = 0;
  for (const member of members) {
    if (member.fullName && member.barcode) {
      const res = await pool.query(
        `INSERT INTO members 
          ("fullName", email, phone, barcode, status, "planId", "stripeCustomerId", "gymId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT ("gymId", barcode) DO NOTHING`,
        [
          member.fullName,
          member.email || '',
          member.phone || '',
          member.barcode,
          member.status || 'active',
          member.planId || null,
          member.stripeCustomerId || null,
          member.gymId || 'gym_001',
        ]
      );
      if (res.rowCount > 0) memberCount++;
    }
  }
  console.log(`- Members migrated: ${memberCount} of ${members.length}`);

  console.log('\nMigration complete! You can now run node Server.js.');
  await pool.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
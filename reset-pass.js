require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetPassword() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const newPassword = process.env.ADMIN_PASSWORD;

  if (!newPassword) {
    console.error('Error: Set ADMIN_PASSWORD in your .env file first!');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPassword, 10);

  // Update password if user exists, or insert if missing
  const res = await pool.query(
    `INSERT INTO admins (username, "passwordHash", "gymId")
     VALUES ($1, $2, $3)
     ON CONFLICT (username) DO UPDATE SET "passwordHash" = $2`,
    [username, hash, 'gym_001']
  );

  console.log(`Successfully updated password for admin user "${username}"!`);
  await pool.end();
}

resetPassword().catch((err) => {
  console.error('Failed to reset password:', err);
  process.exit(1);
});
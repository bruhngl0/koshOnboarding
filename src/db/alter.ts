import { db } from './index';
import { sql } from 'drizzle-orm';

async function run() {
  if (!db) {
    console.error('ERROR: Database client is not initialized.');
    process.exit(1);
  }
  console.log('Adding email column to onboarding_submissions in Neon database...');
  try {
    // Add email column IF NOT EXISTS
    await db.execute(sql`
      ALTER TABLE onboarding_submissions 
      ADD COLUMN IF NOT EXISTS email TEXT NOT NULL DEFAULT 'test@example.com';
    `);
    console.log('SUCCESS: Column "email" has been added successfully.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR: Failed to alter database table:', err);
    process.exit(1);
  }
}

run();

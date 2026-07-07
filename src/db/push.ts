import { ensureTableExists } from './index';

async function run() {
  console.log('Initializing database connection...');
  try {
    await ensureTableExists();
    console.log('SUCCESS: Table schema "onboarding_submissions" successfully verified/created in Neon database.');
    process.exit(0);
  } catch (err) {
    console.error('ERROR: Failed to push schema to Neon database:', err);
    process.exit(1);
  }
}

run();

import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import '@/lib/errorHandler';

// Load Next.js environment configurations (needed for scripts running outside next dev context)
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(process.cwd());
} catch (e) {
  // Ignore in production build or contexts without next/env
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('Warning: DATABASE_URL is not set. Database operations will fail.');
}

// Tuned primary database connection pool
const pool = databaseUrl ? new Pool({
  connectionString: databaseUrl,
  max: 15, // Max 15 concurrent pool connections
  idleTimeoutMillis: 15000, // Terminate idle connections after 15 seconds
  connectionTimeoutMillis: 2000 // Error out if connection acquisition exceeds 2s
}) : null;
export const db = pool ? drizzle(pool, { schema }) : null;

// Tuned read replica database connection pool
const readReplicaUrl = process.env.READ_REPLICA_URL || databaseUrl;
const readPool = readReplicaUrl ? new Pool({
  connectionString: readReplicaUrl,
  max: 15,
  idleTimeoutMillis: 15000,
  connectionTimeoutMillis: 2000
}) : null;
export const readDb = readPool ? drizzle(readPool, { schema }) : db;

let tableChecked = false;

export async function ensureTableExists() {
  if (tableChecked) return;
  if (!db) {
    throw new Error('Database client is not initialized. Please set DATABASE_URL.');
  }
  
  try {
    // Auto-create onboarding table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS onboarding_submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ref TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT NOT NULL,
        dob DATE NOT NULL,
        age INTEGER,
        gender TEXT,
        weight NUMERIC(5, 2) NOT NULL,
        height NUMERIC(5, 2) NOT NULL,
        target_weight NUMERIC(5, 2),
        bmi NUMERIC(4, 2),
        goal TEXT,
        activity TEXT,
        diet TEXT NOT NULL,
        spice TEXT,
        allergies TEXT[],
        cuisines TEXT[],
        fav_dish TEXT,
        dislikes TEXT,
        medical TEXT,
        delivery_plan TEXT,
        address TEXT NOT NULL,
        landmark TEXT,
        delivery_note TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending' NOT NULL,
        submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Auto-create persistent email retry queue table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS email_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        ref TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        last_attempt_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Auto-create generic persistent job queue table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS job_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_type TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        attempts INTEGER DEFAULT 0 NOT NULL,
        max_attempts INTEGER DEFAULT 5 NOT NULL,
        last_attempt_at TIMESTAMP,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create database extension for trigram matching to optimize search queries
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Create sorting index on onboarding_submissions (submitted_at DESC)
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
      ON onboarding_submissions (submitted_at DESC);
    `);

    // Create GIN trigram indexes on name, ref, and phone fields to optimize substring search
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_name_trgm 
      ON onboarding_submissions USING GIN (name gin_trgm_ops);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_ref_trgm 
      ON onboarding_submissions USING GIN (ref gin_trgm_ops);
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_submissions_phone_trgm 
      ON onboarding_submissions USING GIN (phone gin_trgm_ops);
    `);

    // Create partial index on job_queue to optimize queue retrieval
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_job_queue_pending_partial 
      ON job_queue (attempts) 
      WHERE status = 'pending';
    `);

    tableChecked = true;
    console.log('Database schema and performance indexes verified/created successfully.');
  } catch (error) {
    console.error('Failed to auto-create tables:', error);
    throw error;
  }
}

import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '@/db';
import { jobQueue } from '@/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { sendConfirmationEmail } from '@/lib/mail';
import { traceSpan } from './tracer';
import os from 'os';

const cpuCores = os.cpus().length || 1;

// Establish Redis Connection with tuned timeouts and retry parameters (connection pooling)
const redisUrl = process.env.REDIS_URL;
export const redisConnection = redisUrl ? new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  maxLoadingRetryTime: 10000,
  connectTimeout: 5000,
  disconnectTimeout: 2000
}) : null;

if (redisConnection) {
  console.log('[QUEUE] Redis connection established. BullMQ mode is active.');
} else {
  console.log('[QUEUE] Redis connection not found. Falling back to DB-backed persistent queue.');
}

// Map of BullMQ Queues
export const bullQueues: Record<string, Queue | null> = {
  email: redisConnection ? new Queue('email', { connection: redisConnection as any }) : null,
  pdf: redisConnection ? new Queue('pdf', { connection: redisConnection as any }) : null,
  webhook: redisConnection ? new Queue('webhook', { connection: redisConnection as any }) : null,
  report: redisConnection ? new Queue('report', { connection: redisConnection as any }) : null,
};

/**
 * Adds a task to the queue. Implements idempotency via jobId, exponential retries, and timeout.
 * Instrumenting with OpenTelemetry distributed trace spans.
 */
export async function addJob(
  jobType: 'email' | 'pdf' | 'webhook' | 'report',
  payload: any,
  jobId?: string
) {
  const finalJobId = jobId || `job-${Math.random().toString(36).substring(2, 15)}`;

  return traceSpan(`queue.publish:${jobType}`, async (span) => {
    span.setAttribute('job.type', jobType);
    span.setAttribute('job.id', finalJobId);
    
    if (redisConnection && bullQueues[jobType]) {
      // BullMQ Production Implementation
      const queue = bullQueues[jobType]!;
      await queue.add(jobType, payload, {
        jobId: finalJobId,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 1000 // Starts at 1s, then 2s, 4s, 8s, 16s...
        },
        timeout: 30000, // 30s timeout cap
        removeOnComplete: true, // Keep Redis memory footprint minimal
        removeOnFail: false // Keeps failed tasks in Redis (acting as DLQ)
      } as any);
      console.log(`[QUEUE: BULLMQ] Job queued successfully. Type: ${jobType}, ID: ${finalJobId}`);
    } else {
      // DB-Backed Fallback Implementation
      if (!db) {
        console.warn('[QUEUE] Database client not initialized. Job skipped.');
        return;
      }

      // Check for idempotency: if job ID already exists, skip
      if (jobId) {
        const existing = await db
          .select()
          .from(jobQueue)
          .where(eq(jobQueue.id, jobId))
          .limit(1);

        if (existing.length > 0) {
          console.log(`[QUEUE: DB] Idempotency match. Skipping duplicate job ID: ${jobId}`);
          return;
        }
      }

      // Insert task into job_queue
      await db.insert(jobQueue).values({
        id: jobId,
        jobType,
        payload: JSON.stringify(payload),
        status: 'pending',
        attempts: 0,
        maxAttempts: 5
      });
      console.log(`[QUEUE: DB] Job logged successfully in database. Type: ${jobType}, ID: ${finalJobId}`);
    }
  });
}

/**
 * Job Executors containing the actual task logic for each async operation.
 */
const jobExecutors: Record<string, (payload: any) => Promise<void>> = {
  email: async (payload: any) => {
    // Sends welcome confirmation email
    await sendConfirmationEmail(payload.email, payload.name, payload.ref);
  },
  pdf: async (payload: any) => {
    console.log(`[JOB EXEC: PDF] Generating meal plan PDF for Ref: ${payload.ref}`);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate work
    console.log('[JOB EXEC: PDF] PDF generated successfully.');
  },
  webhook: async (payload: any) => {
    console.log(`[JOB EXEC: WEBHOOK] Posting confirmation webhook to URL: ${payload.url}`);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate work
    console.log('[JOB EXEC: WEBHOOK] Webhook delivered successfully.');
  },
  report: async (payload: any) => {
    console.log(`[JOB EXEC: REPORT] Compiling cohorts demographic report. Period: ${payload.period}`);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate work
    console.log('[JOB EXEC: REPORT] Report generated and cached.');
  }
};

/**
 * BullMQ Worker Subscriptions (Active only if Redis is available).
 * Scalable horizontally by instantiating multiple instances connecting to the same Redis.
 */
if (redisConnection) {
  Object.keys(bullQueues).forEach((queueName) => {
    new Worker(
      queueName,
      async (job) => {
        console.log(`[WORKER: BULLMQ] Processing job ${job.id} from queue ${queueName}...`);
        const executor = jobExecutors[queueName];
        if (executor) {
          // Trace individual worker executions
          await traceSpan(`queue.process:${queueName}`, async (span) => {
            span.setAttribute('job.id', job.id || 'unknown');
            await executor(job.data);
          });
        } else {
          throw new Error(`No executor declared for queue type: ${queueName}`);
        }
      },
      { connection: redisConnection as any, concurrency: cpuCores }
    );
  });
}

/**
 * Fallback Background Database Queue Processor.
 * Evaluates pending database-backed queue tasks when Redis is not present.
 */
export async function processDbJobQueue() {
  if (!db) return;

  // Retrieve pending tasks that have not exceeded max retry limits
  const pendingJobs = await db
    .select()
    .from(jobQueue)
    .where(
      and(
        eq(jobQueue.status, 'pending'),
        lt(jobQueue.attempts, jobQueue.maxAttempts)
      )
    );

  if (pendingJobs.length === 0) return;

  console.log(`[QUEUE: DB] Found ${pendingJobs.length} pending database job(s) to process.`);

  for (const job of pendingJobs) {
    // Lock the job immediately by incrementing attempts count
    await db
      .update(jobQueue)
      .set({
        attempts: job.attempts + 1,
        lastAttemptAt: new Date(),
        status: 'processing'
      })
      .where(eq(jobQueue.id, job.id));

    try {
      const executor = jobExecutors[job.jobType];
      if (!executor) {
        throw new Error(`Unsupported job type: ${job.jobType}`);
      }

      const parsedPayload = JSON.parse(job.payload);
      
      // Trace database-backed queue job execution
      await traceSpan(`queue.process.db:${job.jobType}`, async (span) => {
        span.setAttribute('job.id', job.id);
        
        // Enforce 30s timeout cap via Promise.race
        await Promise.race([
          executor(parsedPayload),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Job execution timed out after 30s')), 30000))
        ]);
      });

      // Mark status as completed
      await db
        .update(jobQueue)
        .set({
          status: 'completed',
          errorMessage: null
        })
        .where(eq(jobQueue.id, job.id));
    } catch (err: any) {
      console.error(`[QUEUE: DB TASK FAILURE] Failed job ID ${job.id} (Attempt ${job.attempts + 1}/${job.maxAttempts}):`, err);
      
      // Update with failure logs, revert to pending if attempts are left
      const nextStatus = job.attempts + 1 >= job.maxAttempts ? 'failed' : 'pending';
      await db
        .update(jobQueue)
        .set({
          status: nextStatus,
          errorMessage: err.message || 'Unknown database queue task failure'
        })
        .where(eq(jobQueue.id, job.id));
    }
  }
}

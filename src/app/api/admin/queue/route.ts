import crypto from 'crypto';
import { db } from '@/db';
import { jobQueue } from '@/db/schema';
import { sql, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { bullQueues } from '@/lib/queue';
import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';

/**
 * @openapi
 * /api/admin/queue:
 *   get:
 *     summary: Queue Monitoring Dashboard stats
 *     description: Retrieves the metric counters for queue jobs from both BullMQ and database fallback sources.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Job metrics list returned successfully.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Server error.
 */
export const GET = withErrorHandler(async () => {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) {
    return apiResponse({
      success: false,
      error: {
        code: 'CONFIGURATION_ERROR',
        message: 'Admin authentication is not configured on the server.'
      },
      status: 500
    });
  }

  // Get cookie values
  const cookieStore = await cookies();
  const token = cookieStore.get('kosh_admin_token')?.value;

  const expectedToken = crypto
    .createHmac('sha256', adminSecret)
    .update('admin-session')
    .digest('hex');

  if (!token || token !== expectedToken) {
    return apiResponse({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Unauthorized access. Please log in.'
      },
      status: 401
    });
  }

  // Check if Redis is active
  const isRedisActive = !!bullQueues.email;

  if (isRedisActive) {
    // BullMQ monitoring counts
    const stats: Record<string, any> = {};

    for (const [queueName, queue] of Object.entries(bullQueues)) {
      if (queue) {
        const [active, completed, failed, waiting, delayed] = await Promise.all([
          queue.getActiveCount(),
          queue.getCompletedCount(),
          queue.getFailedCount(),
          queue.getWaitingCount(),
          queue.getDelayedCount()
        ]);
        stats[queueName] = { active, completed, failed, waiting, delayed };
      }
    }

    return apiResponse({
      success: true,
      data: {
        mode: 'BullMQ (Redis)',
        stats
      }
    });
  } else {
    // Database-backed job queue monitoring counts
    if (!db) {
      return apiResponse({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database client not initialized.'
        },
        status: 500
      });
    }

    // Query counters grouped by job type and status
    const result = await db
      .select({
        jobType: jobQueue.jobType,
        status: jobQueue.status,
        count: sql<number>`count(*)::integer`
      })
      .from(jobQueue)
      .groupBy(jobQueue.jobType, jobQueue.status);

    // Structure metrics map
    const stats: Record<string, any> = {
      email: { pending: 0, processing: 0, completed: 0, failed: 0 },
      pdf: { pending: 0, processing: 0, completed: 0, failed: 0 },
      webhook: { pending: 0, processing: 0, completed: 0, failed: 0 },
      report: { pending: 0, processing: 0, completed: 0, failed: 0 }
    };

    result.forEach((row) => {
      if (stats[row.jobType]) {
        stats[row.jobType][row.status] = row.count;
      }
    });

    return apiResponse({
      success: true,
      data: {
        mode: 'Database-backed Persistent Queue',
        stats
      }
    });
  }
});

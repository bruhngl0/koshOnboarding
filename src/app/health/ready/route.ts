import { getShutdownState } from '@/lib/errorHandler';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { redisConnection } from '@/lib/queue';
import { apiResponse } from '@/lib/response';

/**
 * Timeout helper to enforce fail-fast behavior on checks.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), ms)
  );
  return Promise.race([promise, timeout]);
}

/**
 * @openapi
 * /health/ready:
 *   get:
 *     summary: Readiness Probe
 *     description: Verifies that database, redis, and critical dependencies are reachable and ready to receive traffic. Used by load balancer and Kubernetes ready probes.
 *     responses:
 *       200:
 *         description: Application is ready.
 *       503:
 *         description: Dependecies are offline or unready.
 */
export async function GET() {
  const isShuttingDown = getShutdownState();

  // 1. Fail fast if process is in shutdown sequence
  if (isShuttingDown) {
    return apiResponse({
      success: false,
      error: {
        code: 'SHUTTING_DOWN',
        message: 'Instance is undergoing graceful shutdown.'
      },
      status: 503
    });
  }

  try {
    // 2. Verify Database Connection (Fail fast after 2 seconds)
    if (!db) {
      throw new Error('Database client not initialized.');
    }
    await withTimeout(
      db.execute(sql`SELECT 1`),
      2000,
      'Database connection timed out'
    );

    // 3. Verify Redis Connection if enabled (Fail fast after 2 seconds)
    if (redisConnection) {
      await withTimeout(
        redisConnection.ping(),
        2000,
        'Redis connection timed out'
      );
    }
    
    return apiResponse({
      success: true,
      data: {
        status: 'ready'
      }
    });
  } catch (err: any) {
    // Server logs the exception details internally
    console.error('[READINESS PROBE FAILURE] Critical dependency is down:', err.message);

    // Never expose database hosts, ports, or credentials in client error response
    return apiResponse({
      success: false,
      error: {
        code: 'DEPENDENCY_OFFLINE',
        message: 'A critical dependency is offline. Cannot serve traffic.'
      },
      status: 503
    });
  }
}

import { getShutdownState } from '@/lib/errorHandler';
import { apiResponse } from '@/lib/response';

/**
 * @openapi
 * /health/live:
 *   get:
 *     summary: Liveness Probe
 *     description: Checks if the application process is running. Used by Kubernetes liveness probes.
 *     responses:
 *       200:
 *         description: Process is running.
 *       503:
 *         description: Process is shutting down.
 */
export async function GET() {
  const isShuttingDown = getShutdownState();

  if (isShuttingDown) {
    return apiResponse({
      success: false,
      error: {
        code: 'SHUTTING_DOWN',
        message: 'Instance is shutting down.'
      },
      status: 503
    });
  }

  return apiResponse({
    success: true,
    data: {
      status: 'live'
    }
  });
}

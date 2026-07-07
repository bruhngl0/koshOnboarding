import { getShutdownState } from '@/lib/errorHandler';
import { apiResponse } from '@/lib/response';

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: API Server Health Check Gate
 *     description: Returns the active status of the service instance. Utilized by load balancers and orchestrators for scaling and connection draining.
 *     responses:
 *       200:
 *         description: Instance is healthy and accepting requests.
 *       503:
 *         description: Instance is undergoing graceful shutdown.
 */
export async function GET() {
  const isShuttingDown = getShutdownState();

  if (isShuttingDown) {
    return apiResponse({
      success: false,
      error: {
        code: 'SHUTTING_DOWN',
        message: 'Server is undergoing a graceful shutdown.'
      },
      status: 503
    });
  }

  return apiResponse({
    success: true,
    data: {
      status: 'healthy'
    }
  });
}

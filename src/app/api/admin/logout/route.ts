import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';

/**
 * @openapi
 * /api/admin/logout:
 *   post:
 *     summary: Admin Portal Logout
 *     description: Clears session cookie kosh_admin_token to deauthenticate admin dashboard access.
 *     responses:
 *       200:
 *         description: Logout successful.
 */
export const POST = withErrorHandler(async () => {
  const response = apiResponse({
    success: true,
    data: {
      message: 'Logged out successfully.'
    }
  });

  // Clear cookie by setting maxAge to 0
  response.cookies.set({
    name: 'kosh_admin_token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0
  });

  return response;
});

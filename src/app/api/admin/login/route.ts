import crypto from 'crypto';
import { z } from 'zod/v4';
import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';

const loginSchema = z.object({
  secret: z.string().min(1, 'Secret is required').max(100, 'Secret is too long'),
}).strict();

/**
 * @openapi
 * /api/admin/login:
 *   post:
 *     summary: Admin Portal Authentication Gate
 *     description: Validates access key and issues HTTP-Only cookie kosh_admin_token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [secret]
 *             properties:
 *               secret:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Invalid secret.
 *       500:
 *         description: Configuration error.
 */
export const POST = withErrorHandler(async (request: Request) => {
  const body = await request.json();
  
  // Validate request payload
  const result = loginSchema.safeParse(body);
  if (!result.success) {
    return apiResponse({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: result.error.flatten().fieldErrors
      },
      status: 400
    });
  }

  const { secret } = result.data;
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

  if (secret !== adminSecret) {
    return apiResponse({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid authentication secret.'
      },
      status: 401
    });
  }

  // Generate a secure HMAC signature of 'admin-session' signed with the secret key
  const expectedToken = crypto
    .createHmac('sha256', adminSecret)
    .update('admin-session')
    .digest('hex');

  // Create NextResponse envelope
  const response = apiResponse({
    success: true,
    data: {
      message: 'Authenticated successfully.'
    }
  });

  response.cookies.set({
    name: 'kosh_admin_token',
    value: expectedToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 // 24 hours session lifetime
  });

  return response;
});

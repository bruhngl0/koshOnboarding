import crypto from 'crypto';
import { db, readDb } from '@/db';
import { onboardingSubmissions } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { cookies } from 'next/headers';
import { addJob, processDbJobQueue } from '@/lib/queue';
import { z } from 'zod/v4';
import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';

const statusUpdateSchema = z.object({
  id: z.string().uuid('Invalid submission ID format'),
  status: z.enum(['pending', 'confirmed']),
}).strict();

let cachedSubmissions: any = null;
let lastCacheTime = 0;
const CACHE_TTL = 5000; // 5 seconds cache TTL

export function invalidateSubmissionsCache() {
  cachedSubmissions = null;
  lastCacheTime = 0;
}

/**
 * @openapi
 * /api/admin/submissions:
 *   get:
 *     summary: Fetch Onboarding Applications List
 *     description: Retrieves the list of submissions from the DB with calculated age fields. Requires kosh_admin_token cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Submissions returned.
 *       401:
 *         description: Unauthorized.
 *       500:
 *         description: Internal error.
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

  // Read from Read Replica database client (readDb) to distribute query loads
  if (!readDb) {
    return apiResponse({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database client not initialized.'
      },
      status: 500
    });
  }

  // Check in-memory cache to bypass DB hits under simulated traffic
  const now = Date.now();
  if (cachedSubmissions && now - lastCacheTime < CACHE_TTL) {
    return apiResponse({
      success: true,
      data: cachedSubmissions,
      meta: {
        total: cachedSubmissions.length
      }
    });
  }

  // Run select query with email, status, dynamic age calculation, and reverse chronological sort
  const result = await readDb
    .select({
      id: onboardingSubmissions.id,
      ref: onboardingSubmissions.ref,
      name: onboardingSubmissions.name,
      phone: onboardingSubmissions.phone,
      email: onboardingSubmissions.email,
      dob: onboardingSubmissions.dob,
      age: sql<number>`
        extract(
          year from age(
            current_date,
            ${onboardingSubmissions.dob}
          )
        )::integer
      `.as('age'),
      gender: onboardingSubmissions.gender,
      weight: onboardingSubmissions.weight,
      height: onboardingSubmissions.height,
      targetWeight: onboardingSubmissions.targetWeight,
      bmi: onboardingSubmissions.bmi,
      goal: onboardingSubmissions.goal,
      activity: onboardingSubmissions.activity,
      diet: onboardingSubmissions.diet,
      spice: onboardingSubmissions.spice,
      allergies: onboardingSubmissions.allergies,
      cuisines: onboardingSubmissions.cuisines,
      favDish: onboardingSubmissions.favDish,
      dislikes: onboardingSubmissions.dislikes,
      medical: onboardingSubmissions.medical,
      deliveryPlan: onboardingSubmissions.deliveryPlan,
      address: onboardingSubmissions.address,
      landmark: onboardingSubmissions.landmark,
      deliveryNote: onboardingSubmissions.deliveryNote,
      notes: onboardingSubmissions.notes,
      status: onboardingSubmissions.status,
      submittedAt: onboardingSubmissions.submittedAt,
    })
    .from(onboardingSubmissions)
    .orderBy(desc(onboardingSubmissions.submittedAt));

  // Update cache store
  cachedSubmissions = result;
  lastCacheTime = now;

  return apiResponse({
    success: true,
    data: result,
    meta: {
      total: result.length
    }
  });
});

/**
 * @openapi
 * /api/admin/submissions:
 *   put:
 *     summary: Update Application Status
 *     description: Confirms or reverts an onboarding submission status. Launches welcome email trigger in background on confirmation.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id, status]
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed]
 *     responses:
 *       200:
 *         description: Status updated successfully.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Submission not found.
 *       500:
 *         description: Internal error.
 */
export const PUT = withErrorHandler(async (request: Request) => {
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

  const body = await request.json();
  
  // Validate request payload
  const result = statusUpdateSchema.safeParse(body);
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

  const { id, status } = result.data;

  // Fetch submission details first to capture email/name/current status
  const [submission] = await db
    .select({
      name: onboardingSubmissions.name,
      email: onboardingSubmissions.email,
      ref: onboardingSubmissions.ref,
      status: onboardingSubmissions.status
    })
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.id, id))
    .limit(1);

  if (!submission) {
    return apiResponse({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Submission not found.'
      },
      status: 404
    });
  }

  // Update status in primary database (writes must hit the master node)
  await db
    .update(onboardingSubmissions)
    .set({ status })
    .where(eq(onboardingSubmissions.id, id));

  // If transitioned from pending -> confirmed, queue the confirmation email job
  if (status === 'confirmed' && submission.status !== 'confirmed') {
    await addJob('email', {
      email: submission.email,
      name: submission.name,
      ref: submission.ref
    }, `email-confirm-${submission.ref}`);

    // Fire off database queue processor as a fallback (runs only if Redis is not active)
    processDbJobQueue().catch((err) => {
      console.error('[BACKGROUND QUEUE PROCESSOR ERROR] Failed to run database jobs:', err);
    });
  }

  // Invalidate cached lists on update to force fresh retrieve
  invalidateSubmissionsCache();

  return apiResponse({
    success: true,
    data: {
      message: `Status updated to ${status} successfully.`
    }
  });
});

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { onboardingSubmissions } from '@/db/schema';
import { isAdminRequest } from '@/lib/adminAuth';
import { opsSyncConfigured, syncSubmissionToOps } from '@/lib/opsSync';
import { apiResponse } from '@/lib/response';
import { withErrorHandler } from '@/lib/errorHandler';

/** A full roster is ~40 rows; give the sequential sync room on Vercel. */
export const maxDuration = 60;

/**
 * POST /api/admin/sync-subscribers
 *
 * Pushes every confirmed submission to Kōsh Operations. Used once to backfill
 * applicants confirmed before the link existed, and any time a sync failed.
 * Safe to run repeatedly: Operations upserts on the submission id.
 */
export const POST = withErrorHandler(async () => {
  if (!(await isAdminRequest())) {
    return apiResponse({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized access. Please log in.' }, status: 401 });
  }
  if (!opsSyncConfigured()) {
    return apiResponse({
      success: false,
      error: { code: 'CONFIGURATION_ERROR', message: 'Set KOSH_OPS_URL and KOSH_OPS_SYNC_TOKEN to sync subscribers.' },
      status: 500,
    });
  }
  if (!db) {
    return apiResponse({ success: false, error: { code: 'DATABASE_ERROR', message: 'Database client not initialized.' }, status: 500 });
  }

  const confirmed = await db
    .select({ id: onboardingSubmissions.id, ref: onboardingSubmissions.ref })
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.status, 'confirmed'));

  let created = 0;
  let updated = 0;
  const failures: { ref: string; message: string }[] = [];

  // Sequential on purpose: tiny volume, and it keeps load on Operations flat.
  for (const row of confirmed) {
    try {
      const result = await syncSubmissionToOps(row.id);
      if (result.created) created += 1;
      else updated += 1;
    } catch (err: unknown) {
      failures.push({ ref: row.ref, message: err instanceof Error ? err.message : 'Unknown error' });
    }
  }

  return apiResponse({
    success: failures.length === 0,
    data: { total: confirmed.length, created, updated, failures },
    ...(failures.length
      ? { error: { code: 'PARTIAL_FAILURE', message: `${failures.length} of ${confirmed.length} failed to sync.`, details: failures } }
      : {}),
    status: failures.length === confirmed.length && confirmed.length > 0 ? 502 : 200,
  });
});

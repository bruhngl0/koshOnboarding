import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { onboardingSubmissions } from '@/db/schema';

/**
 * Pushes a confirmed submission to Kōsh Operations (kosh-main), which owns
 * the subscriber roster.
 *
 * Kōsh Operations upserts on the submission id, so this is safe to retry and
 * safe to run twice: the first call creates the subscriber, later calls only
 * refresh contact and dietary details. Status, plan and start date are decided
 * in Operations and are never overwritten from here.
 *
 * Config: KOSH_OPS_URL (e.g. https://kosh.vercel.app) and KOSH_OPS_SYNC_TOKEN,
 * which must equal ONBOARDING_SYNC_TOKEN on the Operations side.
 */

const TIMEOUT_MS = 10_000;

export class OpsSyncError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
    this.name = 'OpsSyncError';
  }
}

export function opsSyncConfigured() {
  return Boolean(process.env.KOSH_OPS_URL && process.env.KOSH_OPS_SYNC_TOKEN);
}

export async function syncSubmissionToOps(submissionId: string): Promise<{ subscriberId: string; created: boolean }> {
  const baseUrl = process.env.KOSH_OPS_URL?.replace(/\/+$/, '');
  const token = process.env.KOSH_OPS_SYNC_TOKEN;
  if (!baseUrl || !token) {
    throw new OpsSyncError('KOSH_OPS_URL and KOSH_OPS_SYNC_TOKEN must be set to sync subscribers.', false);
  }
  if (!db) throw new OpsSyncError('Database client not initialized.', true);

  // Read at send time, not enqueue time, so a retry carries the latest details.
  const [row] = await db
    .select()
    .from(onboardingSubmissions)
    .where(eq(onboardingSubmissions.id, submissionId))
    .limit(1);

  if (!row) throw new OpsSyncError(`Submission ${submissionId} no longer exists.`, false);
  if (row.status !== 'confirmed') {
    throw new OpsSyncError(`Submission ${row.ref} is not confirmed; not syncing.`, false);
  }

  const payload = {
    ref: row.ref,
    name: row.name,
    phone: row.phone,
    email: row.email,
    address: row.address,
    landmark: row.landmark,
    deliveryNote: row.deliveryNote,
    deliveryPlan: row.deliveryPlan,
    diet: row.diet,
    allergies: row.allergies ?? [],
    dislikes: row.dislikes,
    medical: row.medical,
    notes: row.notes,
    dob: row.dob,
    gender: row.gender,
    weight: row.weight,
    height: row.height,
    targetWeight: row.targetWeight,
    bmi: row.bmi,
    goal: row.goal,
    activity: row.activity,
    spice: row.spice,
    cuisines: row.cuisines ?? [],
    favDish: row.favDish,
    submittedAt: row.submittedAt?.toISOString() ?? null,
  };

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/v1/integrations/onboarding/subscribers/${submissionId}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err: unknown) {
    throw new OpsSyncError(`Could not reach Kōsh Operations: ${err instanceof Error ? err.message : String(err)}`, true);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.error?.message ?? `HTTP ${response.status}`;
    // 4xx (bad token, invalid payload) will not fix itself on retry; 5xx and 429 might.
    const retryable = response.status >= 500 || response.status === 429;
    throw new OpsSyncError(`Kōsh Operations rejected ${row.ref}: ${message}`, retryable);
  }

  return { subscriberId: body?.data?.subscriber?.id, created: Boolean(body?.data?.created) };
}

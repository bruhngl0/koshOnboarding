import crypto from 'crypto';
import { cookies } from 'next/headers';

/**
 * True when the request carries a valid admin session cookie. Same check the
 * existing admin routes inline; the comparison is constant-time.
 */
export async function isAdminRequest(): Promise<boolean> {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return false;

  const token = (await cookies()).get('kosh_admin_token')?.value ?? '';
  const expected = crypto.createHmac('sha256', adminSecret).update('admin-session').digest('hex');

  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

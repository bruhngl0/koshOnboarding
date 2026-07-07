import { redisConnection } from './queue';

// Simple in-memory storage for sliding window fallback
const memoryStore = new Map<string, number[]>();
const CLEANUP_INTERVAL = 60000; // 1 minute cleanup loop

// Cleanup interval to avoid memory leaks in fallback mode
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, timestamps] of memoryStore.entries()) {
      const filtered = timestamps.filter(ts => now - ts < 60000);
      if (filtered.length === 0) {
        memoryStore.delete(key);
      } else {
        memoryStore.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL);
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfter: number;
}

/**
 * Sliding Window Rate Limiter using Redis (if active) or in-memory fallback.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (redisConnection) {
    const client = redisConnection;
    const redisKey = `rate_limit:${key}`;
    const memberId = `${now}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      // Execute sliding window operations via a Redis multi/transaction block
      const multi = client.multi();
      multi.zremrangebyscore(redisKey, '-inf', String(windowStart));
      multi.zcard(redisKey);
      multi.zadd(redisKey, String(now), memberId);
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      
      const results = await multi.exec();
      if (!results) {
        throw new Error('Redis transaction execution returned null');
      }

      // results[1] contains the card count before the insert (if using zadd in the transaction)
      // Multi results are arrays of [error, result]
      const count = (results[1][1] as number) || 0;

      if (count >= limit) {
        // Remove the member we just added as it exceeded the limit
        await client.zrem(redisKey, memberId);

        // Fetch the oldest timestamp in the active window to compute retryAfter
        const oldestRange = await client.zrangebyscore(redisKey, String(windowStart), '+inf', 'WITHSCORES', 'LIMIT', 0, 1);
        const oldestTimestamp = oldestRange.length > 1 ? parseInt(oldestRange[1]) : now;
        const retryAfter = Math.ceil(((oldestTimestamp + windowMs) - now) / 1000);

        return {
          allowed: false,
          limit,
          remaining: 0,
          retryAfter: retryAfter > 0 ? retryAfter : 1
        };
      }

      return {
        allowed: true,
        limit,
        remaining: limit - count - 1,
        retryAfter: 0
      };
    } catch (error) {
      console.warn('[RATE LIMIT] Redis operation exception, falling back to memory rate limiter:', error);
    }
  }

  // Fallback In-Memory Sliding Window Algorithm
  let timestamps = memoryStore.get(key) || [];
  timestamps = timestamps.filter(ts => ts > windowStart);

  if (timestamps.length >= limit) {
    const oldestTimestamp = timestamps[0];
    const retryAfter = Math.ceil(((oldestTimestamp + windowMs) - now) / 1000);
    
    memoryStore.set(key, timestamps);

    return {
      allowed: false,
      limit,
      remaining: 0,
      retryAfter: retryAfter > 0 ? retryAfter : 1
    };
  }

  timestamps.push(now);
  memoryStore.set(key, timestamps);

  return {
    allowed: true,
    limit,
    remaining: limit - timestamps.length,
    retryAfter: 0
  };
}

/**
 * Resolves the client IP address from standard headers.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

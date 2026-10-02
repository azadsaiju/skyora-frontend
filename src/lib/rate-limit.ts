import "server-only";

/**
 * In-memory rate limiting (per server instance — fine for this deployment).
 * Two mechanisms:
 *  1. Fixed-window-ish sliding counter — used for public endpoints (enquiry).
 *  2. Login lockout — N failures within a window locks the key for a duration.
 */

interface Bucket {
  timestamps: number[];
  lockedUntil?: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = Date.now();

function sweep(): void {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.lockedUntil && bucket.lockedUntil <= now) {
      bucket.lockedUntil = undefined;
    }
    if (
      !bucket.lockedUntil &&
      (bucket.timestamps.length === 0 ||
        now - bucket.timestamps[bucket.timestamps.length - 1]! > 3_600_000)
    ) {
      buckets.delete(key);
    }
  }
}

/** Sliding-window rate limit. */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfterSec: number } {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  if (bucket.timestamps.length >= max) {
    buckets.set(key, bucket);
    const retryAfterSec = Math.max(
      1,
      Math.ceil((bucket.timestamps[0]! + windowMs - now) / 1000)
    );
    return { allowed: false, retryAfterSec };
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}

/** Is this login key currently locked out? */
export function loginLockState(key: string): {
  locked: boolean;
  retryAfterSec: number;
} {
  sweep();
  const bucket = buckets.get(key);
  if (!bucket?.lockedUntil) return { locked: false, retryAfterSec: 0 };
  const now = Date.now();
  if (bucket.lockedUntil <= now) {
    bucket.lockedUntil = undefined;
    buckets.set(key, bucket);
    return { locked: false, retryAfterSec: 0 };
  }
  return {
    locked: true,
    retryAfterSec: Math.ceil((bucket.lockedUntil - now) / 1000),
  };
}

/** Record a failed login; locks the key after `maxFails` within `windowMs`. */
export function recordLoginFailure(
  key: string,
  maxFails = 5,
  windowMs = 15 * 60_000,
  lockMs = 15 * 60_000
): void {
  sweep();
  const now = Date.now();
  const bucket = buckets.get(key) ?? { timestamps: [] };
  if (bucket.lockedUntil && bucket.lockedUntil <= now) {
    bucket.lockedUntil = undefined;
  }
  if (bucket.lockedUntil) {
    buckets.set(key, bucket);
    return; // already locked — ignore further failures
  }
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);
  bucket.timestamps.push(now);
  if (bucket.timestamps.length >= maxFails) {
    bucket.lockedUntil = now + lockMs;
    bucket.timestamps = [];
  }
  buckets.set(key, bucket);
}

/** Clear failures after a successful login. */
export function clearLoginFailures(key: string): void {
  buckets.delete(key);
}

"use server";

import { checkLoginRateLimit } from "@/lib/rate-limit";

export async function checkRateLimitAction(email: string) {
  // Check rate limit status for this email (same parameters as auth.ts)
  const rl = checkLoginRateLimit(email, 5, 1 * 60 * 1000);
  return { allowed: rl.allowed, remainingMs: rl.remainingMs };
}

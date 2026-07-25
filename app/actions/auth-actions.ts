"use server";
import { checkLoginRateLimit } from "@/lib/rate-limit";

export async function preCheckLoginRateLimit(email: string) {
  const rl = checkLoginRateLimit(email, 5, 5 * 60 * 1000);
  if (!rl.allowed) {
    return { error: "RATE_LIMIT", ms: rl.remainingMs };
  }
  return { success: true };
}

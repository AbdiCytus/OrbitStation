// In-memory rate limiting map
// NOTE: Jika di-deploy ke Vercel (Serverless), state in-memory ini akan ter-reset saat instance cold-start.
// Untuk production skala besar, gunakan Redis (seperti Upstash Redis) atau Vercel KV.

type RateLimitRecord = {
  count: number;
  lastReset: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Cek apakah sebuah IP sudah melewati batas rate limit.
 * @param ip IP Address dari request
 * @param limit Batas jumlah request
 * @param windowMs Jangka waktu (ms) sebelum reset (contoh: 60000 = 1 menit)
 * @returns true jika diizinkan, false jika ditolak (Rate Limited)
 */
export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  // Jika belum ada record, atau record sudah kedaluwarsa (lewat dari windowMs)
  if (!record || now - record.lastReset > windowMs) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return true;
  }

  // Jika sudah mencapai limit
  if (record.count >= limit) {
    return false;
  }

  // Tambah hitungan
  record.count += 1;
  rateLimitMap.set(ip, record);
  return true;
}

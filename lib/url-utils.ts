/**
 * Normalizes a raw URL string ensuring it has a valid protocol.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw ? raw.trim() : "";
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return `https://${trimmed}`;
}

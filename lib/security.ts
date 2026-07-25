/**
 * Security Utilities
 */

/**
 * Validates if a URL is safe to fetch (Prevents SSRF).
 * Checks protocol and rejects localhost, private IPs, and AWS metadata endpoint.
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // 1. Validasi Protocol
    if (!["http:", "https:"].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname.toLowerCase();

    // 2. Reject obvious internal hostnames
    const blockedHostnames = ["localhost", "127.0.0.1", "0.0.0.0", "::1"];
    if (blockedHostnames.includes(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal")) {
      return false;
    }

    // 3. Reject AWS EC2 Metadata IP
    if (hostname === "169.254.169.254" || hostname === "fd00:ec2::254") {
      return false;
    }

    // 4. Check if hostname is an IPv4 address and block if private
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIPv4) {
      const parts = hostname.split(".").map(Number);
      const [p1, p2] = parts;
      
      if (p1 === 10) return false; // 10.0.0.0/8
      if (p1 === 172 && p2 >= 16 && p2 <= 31) return false; // 172.16.0.0/12
      if (p1 === 192 && p2 === 168) return false; // 192.168.0.0/16
      if (p1 === 127) return false; // loopback
      if (p1 === 169 && p2 === 254) return false; // link-local
      if (p1 === 0) return false; // 0.0.0.0
    }

    return true;
  } catch {
    return false;
  }
}

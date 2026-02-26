/**
 * Validates external URLs to prevent SSRF (Server-Side Request Forgery).
 *
 * Blocks requests to private/internal network addresses, non-HTTP protocols,
 * and localhost.
 */

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./, // AWS metadata endpoint
  /^0\./,
  /^\[::1\]$/,
  /^\[fc/i, // IPv6 unique local
  /^\[fd/i, // IPv6 unique local
  /^\[fe80/i, // IPv6 link-local
  /^\[0+:0+:0+:0+:0+:0+:0+:0*1?\]$/, // IPv6 loopback variants
];

export function validateExternalUrl(urlString: string): void {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL format");
  }

  // Only allow HTTP(S) protocols
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = url.hostname;

  // Block private/internal IP ranges and localhost
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      throw new Error("URL points to a private or internal address");
    }
  }

  // Block URLs without a hostname (e.g. http:///etc/passwd)
  if (!hostname || hostname.length === 0) {
    throw new Error("URL must have a valid hostname");
  }

  // Block numeric-only hostnames that could resolve to internal IPs
  // (e.g. http://2130706433 = 127.0.0.1 in decimal)
  if (/^\d+$/.test(hostname)) {
    throw new Error("Numeric-only hostnames are not allowed");
  }
}

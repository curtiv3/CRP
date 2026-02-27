/**
 * Validates external URLs to prevent SSRF (Server-Side Request Forgery).
 *
 * Blocks requests to private/internal network addresses, non-HTTP protocols,
 * localhost, and various IP encoding tricks (hex, octal, decimal).
 *
 * Also provides `validateResolvedIp()` for DNS-rebinding protection — call it
 * on the resolved IP address before making the actual HTTP request.
 */

import { lookup } from "dns/promises";

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

/** Check an IP string against private/internal ranges. */
function isPrivateIp(ip: string): boolean {
  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(ip)) {
      return true;
    }
  }
  return false;
}

/**
 * Validate a URL at parse time. Catches protocol, hostname format, and
 * obvious IP-based bypasses.
 */
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

  // Block URLs without a hostname (e.g. http:///etc/passwd)
  if (!hostname || hostname.length === 0) {
    throw new Error("URL must have a valid hostname");
  }

  // Block private/internal IP ranges and localhost
  if (isPrivateIp(hostname)) {
    throw new Error("URL points to a private or internal address");
  }

  // Block numeric-only hostnames that could resolve to internal IPs
  // Decimal: http://2130706433 = 127.0.0.1
  if (/^\d+$/.test(hostname)) {
    throw new Error("Numeric-only hostnames are not allowed");
  }

  // Block hex-encoded IPs: http://0x7f000001 = 127.0.0.1
  if (/^0x[0-9a-f]+$/i.test(hostname)) {
    throw new Error("Hex-encoded hostnames are not allowed");
  }

  // Block octal-encoded IPs: http://0177.0.0.1 = 127.0.0.1
  // Octal IPs have leading zeros in dotted notation
  if (/^0\d+(\.\d+){0,3}$/.test(hostname)) {
    throw new Error("Octal-encoded hostnames are not allowed");
  }
}

/**
 * Resolve the hostname via DNS and verify the resolved address is not
 * private/internal. This prevents DNS rebinding attacks where a hostname
 * resolves to a public IP at validation time but to a private IP at fetch time.
 *
 * Call this immediately before making the HTTP request.
 */
export async function validateResolvedUrl(urlString: string): Promise<void> {
  // Run static checks first
  validateExternalUrl(urlString);

  const url = new URL(urlString);
  const hostname = url.hostname;

  // If the hostname is already an IP literal, static checks are sufficient
  if (/^[\d.]+$/.test(hostname) || hostname.startsWith("[")) {
    return;
  }

  // Resolve DNS and check the resolved IP
  try {
    const { address } = await lookup(hostname);
    if (isPrivateIp(address)) {
      throw new Error("URL resolves to a private or internal address");
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes("private")) {
      throw error;
    }
    // DNS resolution failure — block the request
    throw new Error("Failed to resolve hostname");
  }
}

/**
 * URL validation utilities for preventing SSRF attacks
 */

type ValidationResult = { isValid: true } | { isValid: false; error: string };

const PRIVATE_IP_RANGES = [
  /^127\./, // 127.0.0.0/8 loopback
  /^10\./, // 10.0.0.0/8 private
  /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12 private
  /^192\.168\./, // 192.168.0.0/16 private
  /^169\.254\./, // 169.254.0.0/16 link-local
  /^0\./, // 0.0.0.0/8
];

const BLOCKED_HOSTNAMES = ['localhost', '[::1]', '::1'];

function isPrivateHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.includes(lower)) return true;
  return PRIVATE_IP_RANGES.some((range) => range.test(hostname));
}

/**
 * Validates a URL for external use (shell.openExternal).
 * Blocks internal IPs/localhost to prevent SSRF attacks.
 */
export function validateExternalUrl(input: string): ValidationResult {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return { isValid: false, error: 'Invalid URL format' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { isValid: false, error: 'URL must use http: or https: protocol' };
  }

  if (isPrivateHost(url.hostname)) {
    return {
      isValid: false,
      error: 'URLs to internal/private addresses are not allowed',
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes and validates an LM Studio base URL.
 * - Automatically prepends http:// for localhost addresses without a protocol
 * - Only allows http/https protocols to prevent SSRF attacks
 * - Validates URL format
 *
 * @param input - Raw URL input from user
 * @returns Sanitized and validated URL
 * @throws Error if URL is invalid or uses a disallowed protocol
 */
export function sanitizeLMStudioURL(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('URL cannot be empty');
  }

  // Auto-prepend http:// for localhost addresses without protocol
  let urlString = trimmed;
  if (!trimmed.includes('://')) {
    // Check if it's a localhost-like address
    if (
      trimmed.startsWith('localhost') ||
      trimmed.startsWith('127.0.0.1') ||
      trimmed.startsWith('::1') ||
      trimmed.startsWith('[::1]')
    ) {
      urlString = `http://${trimmed}`;
    } else {
      throw new Error('URL must include protocol (http:// or https://)');
    }
  }

  // Parse and validate URL
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow http/https protocols to prevent SSRF
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(
      `Protocol "${url.protocol}" is not allowed. Only http:// and https:// are permitted.`,
    );
  }

  return url.toString();
}

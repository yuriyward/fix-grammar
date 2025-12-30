/**
 * URL validation utilities for preventing SSRF attacks
 */

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

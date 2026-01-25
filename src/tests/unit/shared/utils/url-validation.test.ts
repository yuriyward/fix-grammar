import { describe, expect, it } from 'vitest';
import { sanitizeLMStudioURL } from '@/shared/utils/url-validation';

describe('sanitizeLMStudioURL', () => {
  describe('valid URLs', () => {
    it('should accept valid http URL', () => {
      expect(sanitizeLMStudioURL('http://example.com')).toBe(
        'http://example.com/',
      );
    });

    it('should accept valid https URL', () => {
      expect(sanitizeLMStudioURL('https://example.com')).toBe(
        'https://example.com/',
      );
    });

    it('should accept URL with port', () => {
      expect(sanitizeLMStudioURL('http://localhost:1234')).toBe(
        'http://localhost:1234/',
      );
    });

    it('should accept URL with path', () => {
      expect(sanitizeLMStudioURL('http://localhost:1234/v1')).toBe(
        'http://localhost:1234/v1',
      );
    });
  });

  describe('localhost auto-prepend', () => {
    it('should auto-prepend http:// to localhost', () => {
      expect(sanitizeLMStudioURL('localhost:1234')).toBe(
        'http://localhost:1234/',
      );
    });

    it('should auto-prepend http:// to 127.0.0.1', () => {
      expect(sanitizeLMStudioURL('127.0.0.1:1234')).toBe(
        'http://127.0.0.1:1234/',
      );
    });

    it('should auto-prepend http:// to [::1]', () => {
      expect(sanitizeLMStudioURL('[::1]:1234')).toBe('http://[::1]:1234/');
    });

    it('should not auto-prepend if URL already has protocol', () => {
      expect(sanitizeLMStudioURL('https://localhost:1234')).toBe(
        'https://localhost:1234/',
      );
    });
  });

  describe('SSRF protection', () => {
    it('should reject file:// protocol', () => {
      expect(() => sanitizeLMStudioURL('file:///etc/passwd')).toThrow(
        'Protocol "file:" is not allowed',
      );
    });

    it('should reject ftp:// protocol', () => {
      expect(() => sanitizeLMStudioURL('ftp://example.com')).toThrow(
        'Protocol "ftp:" is not allowed',
      );
    });

    it('should reject data: protocol', () => {
      // data: URLs don't have :// so they're caught by the protocol check
      expect(() => sanitizeLMStudioURL('data:text/plain,hello')).toThrow(
        'URL must include protocol',
      );
    });

    it('should reject javascript: protocol', () => {
      // javascript: URLs don't have :// so they're caught by the protocol check
      expect(() => sanitizeLMStudioURL('javascript:alert(1)')).toThrow(
        'URL must include protocol',
      );
    });
  });

  describe('validation errors', () => {
    it('should reject empty string', () => {
      expect(() => sanitizeLMStudioURL('')).toThrow('URL cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(() => sanitizeLMStudioURL('   ')).toThrow('URL cannot be empty');
    });

    it('should reject invalid URL format', () => {
      expect(() => sanitizeLMStudioURL('not a url')).toThrow(
        'URL must include protocol',
      );
    });

    it('should reject malformed URL', () => {
      expect(() => sanitizeLMStudioURL('http://')).toThrow(
        'Invalid URL format',
      );
    });
  });

  describe('URL normalization', () => {
    it('should trim whitespace', () => {
      expect(sanitizeLMStudioURL('  http://localhost:1234  ')).toBe(
        'http://localhost:1234/',
      );
    });

    it('should normalize URL with trailing slash', () => {
      expect(sanitizeLMStudioURL('http://localhost:1234/')).toBe(
        'http://localhost:1234/',
      );
    });
  });
});

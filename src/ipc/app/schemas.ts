/**
 * Zod schemas for app IPC
 */
import { z } from 'zod';

export const platformSchema = z.enum([
  'aix',
  'android',
  'darwin',
  'freebsd',
  'haiku',
  'linux',
  'openbsd',
  'sunos',
  'win32',
  'cygwin',
  'netbsd',
]);

export const appVersionSchema = z.string();

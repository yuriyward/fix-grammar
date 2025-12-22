/**
 * Supported language definitions
 */
import type { Language } from '@/renderer/lib/language';

export default [
  {
    key: 'en',
    nativeName: 'English',
    prefix: 'EN',
  },
  {
    key: 'pl',
    nativeName: 'Polski',
    prefix: 'PL',
  },
  {
    key: 'uk',
    nativeName: 'Українська',
    prefix: 'UK',
  },
] as const satisfies Language[];

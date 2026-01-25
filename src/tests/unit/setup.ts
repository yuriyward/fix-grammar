/**
 * Vitest setup with jest-dom matchers
 */
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock electron-store for tests that import main process modules
vi.mock('electron-store', () => {
  return {
    default: class MockElectronStore {
      private data: Record<string, unknown>;
      private defaults: Record<string, unknown>;

      constructor(options?: { defaults?: Record<string, unknown> }) {
        this.defaults = options?.defaults ?? {};
        this.data = { ...this.defaults };
      }

      get store() {
        return this.data;
      }

      get(key: string) {
        const keys = key.split('.');
        let value: unknown = this.data;
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = (value as Record<string, unknown>)[k];
          } else {
            return undefined;
          }
        }
        return value;
      }

      set(keyOrObject: string | Record<string, unknown>, value?: unknown) {
        if (typeof keyOrObject === 'string') {
          const keys = keyOrObject.split('.');
          let target = this.data;
          for (let i = 0; i < keys.length - 1; i++) {
            const k = keys[i];
            if (k && !(k in target)) {
              target[k] = {};
            }
            if (k) target = target[k] as Record<string, unknown>;
          }
          const lastKey = keys[keys.length - 1];
          if (lastKey) target[lastKey] = value;
        } else {
          Object.assign(this.data, keyOrObject);
        }
      }

      delete(key: string) {
        delete this.data[key];
      }

      clear() {
        this.data = { ...this.defaults };
      }
    },
  };
});

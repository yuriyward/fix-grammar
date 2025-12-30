/**
 * Notifications storage tests
 *
 * Focusing on normalization logic and storage interactions.
 * We skip testing randomUUID generation specifically to avoid complex mocking of node:crypto,
 * trusting that node's crypto implementation works.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// We need to re-import the module for every test to ensure a fresh store instance if we were accessing the instance
// But since the module creates a top-level instance, we might need a way to reset it or mock the store better.
// The previous mock approach with hoisted variables was better for state reset.
// Let's try to restore the hoisted mock approach but without node:crypto complexity.

const { mockStoreMap } = vi.hoisted(() => ({ mockStoreMap: new Map() }));

vi.mock('electron-store', () => {
  return {
    default: class {
      get(key: string) {
        return mockStoreMap.get(key);
      }
      set(key: string, value: unknown) {
        mockStoreMap.set(key, value);
      }
    },
  };
});

// Since we are testing logic that relies on import-time execution, we'll use dynamic imports
// or just standard imports if we can reset the state.
// The `src/main/storage/notifications.ts` creates the store instance at module level.

describe('Notifications storage', () => {
  beforeEach(() => {
    vi.resetModules();
    mockStoreMap.clear();
    mockStoreMap.set('notifications', []);
  });

  describe('normalizeNotification edge cases', () => {
    it('rejects null/undefined/primitive inputs', async () => {
      mockStoreMap.set('notifications', [null, undefined, 42, 'string']);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      expect(listNotifications()).toEqual([]);
    });

    it('rejects objects with missing/invalid title', async () => {
      mockStoreMap.set('notifications', [
        { type: 'error', id: '1' }, // missing title
        { title: null, type: 'error' },
        { title: 123, type: 'error' },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      expect(listNotifications()).toEqual([]);
    });

    it('defaults invalid types to info', async () => {
      mockStoreMap.set('notifications', [{ title: 'Test', type: 'invalid' }]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();
      expect(list).toHaveLength(1);
      expect(list[0]?.type).toBe('info');
    });

    it('generates ID if missing', async () => {
      mockStoreMap.set('notifications', [{ title: 'Test', type: 'info' }]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();
      expect(list[0]?.id).toBeDefined();
      expect(typeof list[0]?.id).toBe('string');
      expect(list[0]?.id.length).toBeGreaterThan(0);
    });

    it('validates timestamps', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Invalid Date', createdAt: 'invalid' },
        { title: 'Infinity Date', createdAt: Infinity },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();
      // Should fallback to Date.now() or similar, definitely a number
      expect(typeof list[0]?.createdAt).toBe('number');
      expect(typeof list[1]?.createdAt).toBe('number');
    });

    it('preserves valid descriptions', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Desc', description: 'My Description' },
        { title: 'No Desc', description: 123 },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();
      // Sort is by createdAt desc, but they might be equal, so order isn't guaranteed perfectly unless we mock dates.
      // Let's just find them.
      const hasDesc = list.find((n) => n.title === 'Desc');
      const noDesc = list.find((n) => n.title === 'No Desc');

      expect(hasDesc?.description).toBe('My Description');
      expect(noDesc?.description).toBeUndefined();
    });
  });

  describe('Auto-read logic', () => {
    it('auto-reads success and info', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Success', type: 'success', createdAt: 1000 },
        { title: 'Info', type: 'info', createdAt: 2000 },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();

      list.forEach((n) => {
        expect(n.readAt).toBe(n.createdAt);
      });
    });

    it('leaves error and warning as unread', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Error', type: 'error', createdAt: 1000 },
        { title: 'Warning', type: 'warning', createdAt: 2000 },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();

      list.forEach((n) => {
        expect(n.readAt).toBeNull();
      });
    });

    it('respects explicit readAt', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Read Error', type: 'error', readAt: 5000 },
        { title: 'Unread Success (Explicit)', type: 'success', readAt: null },
        // Note: Logic might force success to be read?
        // Let's check logic: if explicit !== undefined return explicit.
        // So yes, we can have unread success if we explicitly save it as null (though addNotification might prevent it, normalize shouldn't).
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();

      const readError = list.find((n) => n.title === 'Read Error');
      const unreadSuccess = list.find(
        (n) => n.title === 'Unread Success (Explicit)',
      );

      expect(readError?.readAt).toBe(5000);
      expect(unreadSuccess?.readAt).toBeNull();
    });
  });

  describe('Public API', () => {
    it('addNotification adds and persists', async () => {
      const { addNotification, listNotifications } = await import(
        '@/main/storage/notifications'
      );
      addNotification({ title: 'New', type: 'error' });

      const list = listNotifications();
      expect(list).toHaveLength(1);
      expect(list[0]?.title).toBe('New');

      // Check store persistence
      const stored = mockStoreMap.get('notifications');
      expect(stored).toHaveLength(1);
    });

    it('markNotificationRead updates readAt', async () => {
      mockStoreMap.set('notifications', [
        {
          id: '1',
          title: 'Error',
          type: 'error',
          readAt: null,
          createdAt: 1000,
        },
      ]);
      const { markNotificationRead, listNotifications } = await import(
        '@/main/storage/notifications'
      );

      markNotificationRead('1');
      const list = listNotifications();
      expect(list[0]?.readAt).not.toBeNull();
      expect(typeof list[0]?.readAt).toBe('number');
    });

    it('markAllNotificationsRead updates all null readAt', async () => {
      mockStoreMap.set('notifications', [
        { id: '1', title: '1', type: 'error', readAt: null },
        { id: '2', title: '2', type: 'warning', readAt: null },
        { id: '3', title: '3', type: 'info', readAt: 100 },
      ]);
      const { markAllNotificationsRead, listNotifications } = await import(
        '@/main/storage/notifications'
      );

      markAllNotificationsRead();
      const list = listNotifications();

      expect(list.every((n) => n.readAt !== null)).toBe(true);
      // Original read timestamp should preserve? Logic says "if item.readAt === null ? update : item"
      const item3 = list.find((n) => n.id === '3');
      expect(item3?.readAt).toBe(100);
    });

    it('clearNotifications empties the store', async () => {
      mockStoreMap.set('notifications', [{ title: 'Gone' }]);
      const { clearNotifications, listNotifications } = await import(
        '@/main/storage/notifications'
      );

      clearNotifications();
      expect(listNotifications()).toEqual([]);
      expect(mockStoreMap.get('notifications')).toEqual([]);
    });

    it('listNotifications sorts by createdAt desc', async () => {
      mockStoreMap.set('notifications', [
        { title: 'Old', createdAt: 1000 },
        { title: 'New', createdAt: 2000 },
      ]);
      const { listNotifications } = await import(
        '@/main/storage/notifications'
      );
      const list = listNotifications();

      expect(list[0]?.title).toBe('New');
      expect(list[1]?.title).toBe('Old');
    });
  });
});

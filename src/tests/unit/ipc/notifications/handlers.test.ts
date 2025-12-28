/**
 * Notifications IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '@/shared/types/notifications';

const {
  mockListNotifications,
  mockMarkNotificationRead,
  mockMarkAllNotificationsRead,
  mockClearNotifications,
} = vi.hoisted(() => {
  const mockListNotifications = vi.fn<[], AppNotification[]>();
  const mockMarkNotificationRead = vi.fn<[string], void>();
  const mockMarkAllNotificationsRead = vi.fn<[], void>();
  const mockClearNotifications = vi.fn<[], void>();

  return {
    mockListNotifications,
    mockMarkNotificationRead,
    mockMarkAllNotificationsRead,
    mockClearNotifications,
  };
});

vi.mock('@/main/storage/notifications', () => ({
  listNotifications: mockListNotifications,
  markNotificationRead: mockMarkNotificationRead,
  markAllNotificationsRead: mockMarkAllNotificationsRead,
  clearNotifications: mockClearNotifications,
}));

describe('Notifications IPC handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listNotificationsHandler', () => {
    it('returns empty array when no notifications exist', async () => {
      mockListNotifications.mockReturnValue([]);

      const { listNotificationsHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callList = createProcedureClient(listNotificationsHandler);

      await expect(callList(undefined)).resolves.toEqual({
        notifications: [],
      });
      expect(mockListNotifications).toHaveBeenCalledTimes(1);
    });

    it('returns list of notifications', async () => {
      const notifications: AppNotification[] = [
        {
          id: '1',
          type: 'error',
          title: 'Error occurred',
          createdAt: 1000,
          readAt: null,
        },
        {
          id: '2',
          type: 'success',
          title: 'Success',
          createdAt: 2000,
          readAt: 2000,
        },
      ];
      mockListNotifications.mockReturnValue(notifications);

      const { listNotificationsHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callList = createProcedureClient(listNotificationsHandler);

      await expect(callList(undefined)).resolves.toEqual({
        notifications,
      });
    });

    it('calls listNotifications from storage', async () => {
      mockListNotifications.mockReturnValue([]);

      const { listNotificationsHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callList = createProcedureClient(listNotificationsHandler);

      await callList(undefined);

      expect(mockListNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('markNotificationReadHandler', () => {
    it('accepts valid notification ID and returns success', async () => {
      const { markNotificationReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkRead = createProcedureClient(markNotificationReadHandler);

      await expect(callMarkRead({ id: 'test-id' })).resolves.toEqual({
        success: true,
      });
      expect(mockMarkNotificationRead).toHaveBeenCalledWith('test-id');
    });

    it('rejects empty string ID', async () => {
      const { markNotificationReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkRead = createProcedureClient(markNotificationReadHandler);

      await expect(callMarkRead({ id: '' })).rejects.toThrow();
      expect(mockMarkNotificationRead).not.toHaveBeenCalled();
    });

    it('rejects when id is missing', async () => {
      const { markNotificationReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkRead = createProcedureClient(markNotificationReadHandler);

      await expect(callMarkRead({} as { id: string })).rejects.toThrow();
      expect(mockMarkNotificationRead).not.toHaveBeenCalled();
    });

    it('calls markNotificationRead with correct ID', async () => {
      const { markNotificationReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkRead = createProcedureClient(markNotificationReadHandler);

      await callMarkRead({ id: 'notification-123' });

      expect(mockMarkNotificationRead).toHaveBeenCalledWith('notification-123');
      expect(mockMarkNotificationRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('markAllNotificationsReadHandler', () => {
    it('returns success', async () => {
      const { markAllNotificationsReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkAllRead = createProcedureClient(
        markAllNotificationsReadHandler,
      );

      await expect(callMarkAllRead(undefined)).resolves.toEqual({
        success: true,
      });
    });

    it('calls markAllNotificationsRead from storage', async () => {
      const { markAllNotificationsReadHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callMarkAllRead = createProcedureClient(
        markAllNotificationsReadHandler,
      );

      await callMarkAllRead(undefined);

      expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearNotificationsHandler', () => {
    it('returns success', async () => {
      const { clearNotificationsHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callClear = createProcedureClient(clearNotificationsHandler);

      await expect(callClear(undefined)).resolves.toEqual({
        success: true,
      });
    });

    it('calls clearNotifications from storage', async () => {
      const { clearNotificationsHandler } = await import(
        '@/ipc/notifications/handlers'
      );
      const callClear = createProcedureClient(clearNotificationsHandler);

      await callClear(undefined);

      expect(mockClearNotifications).toHaveBeenCalledTimes(1);
    });
  });
});

import { randomUUID } from 'node:crypto';
import ElectronStore from 'electron-store';
import type {
  AppNotification,
  AppNotificationPayload,
} from '@/shared/types/notifications';

type NotificationStore = {
  notifications: AppNotification[];
};

const MAX_NOTIFICATIONS = 100;

const notificationStore = new ElectronStore<NotificationStore>({
  name: 'notifications',
  defaults: {
    notifications: [],
  },
});

function normalizeNotification(
  input: unknown,
  fallbackCreatedAt: number,
): AppNotification | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const title = typeof record.title === 'string' ? record.title : null;
  if (!title) return null;

  const type = record.type;
  const normalizedType =
    type === 'success' ||
    type === 'error' ||
    type === 'info' ||
    type === 'warning'
      ? type
      : 'info';

  const description =
    typeof record.description === 'string' ? record.description : undefined;

  const createdAt =
    typeof record.createdAt === 'number' && Number.isFinite(record.createdAt)
      ? record.createdAt
      : fallbackCreatedAt;

  const readAt = (() => {
    const explicit =
      record.readAt === null
        ? null
        : typeof record.readAt === 'number' && Number.isFinite(record.readAt)
          ? record.readAt
          : undefined;

    if (explicit !== undefined) return explicit;

    return normalizedType === 'error' || normalizedType === 'warning'
      ? null
      : createdAt;
  })();

  const id =
    typeof record.id === 'string' && record.id.length > 0
      ? record.id
      : randomUUID();

  return {
    id,
    type: normalizedType,
    title,
    description,
    createdAt,
    readAt,
  };
}

function getAll(): AppNotification[] {
  const items = notificationStore.get('notifications');
  if (!Array.isArray(items)) return [];

  const now = Date.now();
  const normalized: AppNotification[] = [];

  for (const item of items) {
    const value = normalizeNotification(item, now);
    if (value) normalized.push(value);
  }

  return normalized;
}

function setAll(items: AppNotification[]): void {
  notificationStore.set('notifications', items.slice(0, MAX_NOTIFICATIONS));
}

export function listNotifications(): AppNotification[] {
  return getAll()
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function addNotification(
  payload: AppNotificationPayload,
): AppNotification {
  const createdAt = Date.now();
  const readAt =
    payload.type === 'error' || payload.type === 'warning' ? null : createdAt;

  const notification: AppNotification = {
    id: randomUUID(),
    createdAt,
    readAt,
    ...payload,
  };

  const updated = [notification, ...getAll()];
  setAll(updated);
  return notification;
}

export function markNotificationRead(id: string): void {
  const updated = getAll().map((item) =>
    item.id === id && item.readAt === null
      ? { ...item, readAt: Date.now() }
      : item,
  );
  setAll(updated);
}

export function markAllNotificationsRead(): void {
  const now = Date.now();
  const updated = getAll().map((item) =>
    item.readAt === null ? { ...item, readAt: now } : item,
  );
  setAll(updated);
}

export function clearNotifications(): void {
  notificationStore.set('notifications', []);
}

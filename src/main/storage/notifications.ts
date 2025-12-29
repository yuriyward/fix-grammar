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

function validateTitle(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function validateType(
  value: unknown,
): 'success' | 'error' | 'info' | 'warning' {
  return value === 'success' ||
    value === 'error' ||
    value === 'info' ||
    value === 'warning'
    ? value
    : 'info';
}

function validateTimestamp(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function validatePersistent(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function validateAction(
  value: unknown,
): AppNotificationPayload['action'] | undefined {
  if (!value || typeof value !== 'object') return undefined;

  const record = value as Record<string, unknown>;
  if (record.type !== 'apply-fix') return undefined;

  const contextId =
    typeof record.contextId === 'string' && record.contextId.length > 0
      ? record.contextId
      : null;
  if (!contextId) return undefined;

  return { type: 'apply-fix', contextId };
}

function validateReadAt(
  value: unknown,
  type: AppNotification['type'],
  createdAt: number,
  persistent: boolean | undefined,
): number | null {
  const explicit =
    value === null
      ? null
      : typeof value === 'number' && Number.isFinite(value)
        ? value
        : undefined;

  if (explicit !== undefined) return explicit;
  if (persistent === true) return null;

  return type === 'error' || type === 'warning' ? null : createdAt;
}

function generateId(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : randomUUID();
}

function normalizeNotification(
  input: unknown,
  fallbackCreatedAt: number,
): AppNotification | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;

  const title = validateTitle(record.title);
  if (!title) return null;

  const type = validateType(record.type);
  const description =
    typeof record.description === 'string' ? record.description : undefined;
  const persistent = validatePersistent(record.persistent);
  const action = validateAction(record.action);
  const createdAt = validateTimestamp(record.createdAt, fallbackCreatedAt);
  const readAt = validateReadAt(record.readAt, type, createdAt, persistent);
  const id = generateId(record.id);

  return {
    id,
    type,
    title,
    description,
    createdAt,
    readAt,
    persistent,
    action,
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

function shouldAutoMarkRead(payload: AppNotificationPayload): boolean {
  return (
    !payload.persistent &&
    payload.type !== 'error' &&
    payload.type !== 'warning'
  );
}

export function addNotification(
  payload: AppNotificationPayload,
): AppNotification {
  const createdAt = Date.now();
  const readAt = shouldAutoMarkRead(payload) ? createdAt : null;

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

export type AppNotificationType = 'success' | 'error' | 'info' | 'warning';

export type NotificationAction = {
  type: 'apply-fix';
  contextId: string;
};

export type AppNotificationPayload = {
  type: AppNotificationType;
  title: string;
  description?: string;
  action?: NotificationAction;
  persistent?: boolean;
};

export type AppNotification = AppNotificationPayload & {
  id: string;
  createdAt: number;
  readAt: number | null;
};

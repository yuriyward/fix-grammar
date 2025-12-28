export type AppNotificationType = 'success' | 'error' | 'info' | 'warning';

export type AppNotificationPayload = {
  type: AppNotificationType;
  title: string;
  description?: string;
};

export type AppNotification = AppNotificationPayload & {
  id: string;
  createdAt: number;
  readAt: number | null;
};

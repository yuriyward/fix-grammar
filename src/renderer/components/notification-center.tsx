import {
  BellIcon,
  CircleAlertIcon,
  InfoIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/actions/notifications';
import { Button } from '@/renderer/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/renderer/components/ui/popover';
import { ScrollArea } from '@/renderer/components/ui/scroll-area';
import i18n from '@/renderer/lib/i18n';
import { cn } from '@/renderer/lib/tailwind';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type { AppNotification } from '@/shared/types/notifications';

function formatTimestamp(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(i18n.language);
}

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'error') return <CircleAlertIcon className="text-destructive" />;
  if (type === 'warning') return <TriangleAlertIcon className="text-warning" />;
  if (type === 'info') return <InfoIcon className="text-info" />;
  return null;
}

export function NotificationCenterButton() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const refresh = useCallback(async () => {
    const items = await listNotifications();
    setNotifications(items);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;
      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) return current;
        return [notification, ...current];
      });
    };

    const onFocus = () => {
      void refresh();
    };

    window.addEventListener(IPC_CHANNELS.NOTIFY, onNotify);
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener(IPC_CHANNELS.NOTIFY, onNotify);
      window.removeEventListener('focus', onFocus);
    };
  }, [refresh]);

  const unreadCount = useMemo(
    () =>
      notifications.filter(
        (item) =>
          item.readAt == null &&
          (item.type === 'error' || item.type === 'warning'),
      ).length,
    [notifications],
  );

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotifications((current) =>
      current.map((item) =>
        item.id === id && item.readAt == null
          ? { ...item, readAt: Date.now() }
          : item,
      ),
    );
  }, []);

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead();
    const now = Date.now();
    setNotifications((current) =>
      current.map((item) =>
        item.readAt == null ? { ...item, readAt: now } : item,
      ),
    );
  }, []);

  const clearAll = useCallback(async () => {
    await clearNotifications();
    setNotifications([]);
  }, []);

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            aria-label="Notifications"
            className="relative"
            size="icon-sm"
            variant="ghost"
          />
        }
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-2 rounded-full bg-destructive" />
        )}
        {unreadCount > 0 && (
          <span
            className={cn(
              'absolute -top-1 -right-1 min-w-4 rounded-full bg-destructive px-1 text-[10px] leading-4 text-white',
              unreadCount > 99 && 'px-1.5',
            )}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-[min(420px,var(--available-width))] p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="font-medium text-sm">Notifications</div>
          <div className="flex items-center gap-2">
            <Button
              disabled={unreadCount === 0}
              size="xs"
              variant="outline"
              onClick={() => void markAllRead()}
            >
              Mark all read
            </Button>
            <Button
              disabled={notifications.length === 0}
              size="xs"
              variant="destructive-outline"
              onClick={() => void clearAll()}
            >
              Clear all
            </Button>
          </div>
        </div>

        <div className="h-px bg-border" />

        {notifications.length === 0 ? (
          <div className="px-4 py-6 text-muted-foreground text-sm">
            No notifications.
          </div>
        ) : (
          <ScrollArea className="max-h-[min(60vh,520px)]">
            <div className="flex flex-col">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={cn(
                    'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent',
                    item.readAt == null &&
                      (item.type === 'error' || item.type === 'warning') &&
                      'bg-accent/30',
                    item.readAt != null && 'opacity-70',
                  )}
                  onClick={() => void markRead(item.id)}
                >
                  <div className="relative mt-0.5 shrink-0 [&>svg]:size-4">
                    <NotificationIcon type={item.type} />
                    {item.readAt == null &&
                      (item.type === 'error' || item.type === 'warning') && (
                        <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary" />
                      )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="truncate font-medium text-sm">
                        {item.title}
                      </div>
                      <div className="shrink-0 text-muted-foreground text-xs">
                        {formatTimestamp(item.createdAt) || '—'}
                      </div>
                    </div>
                    {item.description && (
                      <div className="mt-1 line-clamp-3 text-muted-foreground text-sm">
                        {item.description}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}

import { useEffect, useRef } from 'react';
import { toastManager } from '@/renderer/components/ui/toast';
import { IPC_CHANNELS } from '@/shared/contracts/ipc-channels';
import type { AppNotification } from '@/shared/types/notifications';

/**
 * Hook that listens for IPC notification events and displays them as toasts.
 */
export function useNotificationListener() {
  const shownNotificationIds = useRef(new Set<string>());

  useEffect(() => {
    const onNotify = (event: Event) => {
      const notification = (event as CustomEvent<AppNotification>).detail;

      if (shownNotificationIds.current.has(notification.id)) {
        return;
      }

      shownNotificationIds.current.add(notification.id);
      toastManager.add({
        type: notification.type,
        title: notification.title,
        description: notification.description,
      });
    };

    window.addEventListener(IPC_CHANNELS.NOTIFY, onNotify);
    return () => {
      window.removeEventListener(IPC_CHANNELS.NOTIFY, onNotify);
    };
  }, []);
}

/**
 * NotificationCenterButton component tests
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '@/shared/types/notifications';

const {
  mockListNotifications,
  mockMarkNotificationRead,
  mockMarkAllNotificationsRead,
  mockClearNotifications,
} = vi.hoisted(() => {
  const mockListNotifications = vi.fn<() => Promise<AppNotification[]>>();
  const mockMarkNotificationRead = vi.fn<(id: string) => Promise<void>>();
  const mockMarkAllNotificationsRead = vi.fn<() => Promise<void>>();
  const mockClearNotifications = vi.fn<() => Promise<void>>();

  return {
    mockListNotifications,
    mockMarkNotificationRead,
    mockMarkAllNotificationsRead,
    mockClearNotifications,
  };
});

vi.mock('@/actions/notifications', () => ({
  listNotifications: mockListNotifications,
  markNotificationRead: mockMarkNotificationRead,
  markAllNotificationsRead: mockMarkAllNotificationsRead,
  clearNotifications: mockClearNotifications,
}));

vi.mock('@/renderer/components/ui/popover', () => ({
  Popover: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverTrigger: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  PopoverContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/renderer/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/renderer/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    disabled,
    ...props
  }: React.ComponentProps<'button'>) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/renderer/lib/i18n', () => ({
  default: {
    language: 'en',
    changeLanguage: vi.fn(),
    t: (key: string) => key,
  },
}));

describe('NotificationCenterButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListNotifications.mockResolvedValue([]);
    mockMarkNotificationRead.mockResolvedValue();
    mockMarkAllNotificationsRead.mockResolvedValue();
    mockClearNotifications.mockResolvedValue();
  });

  describe('unread count calculation', () => {
    it('counts only unread error and warning notifications', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error',
          createdAt: 1000,
          readAt: null,
        },
        {
          id: '2',
          type: 'warning',
          title: 'Warning',
          createdAt: 2000,
          readAt: null,
        },
        {
          id: '3',
          type: 'success',
          title: 'Success',
          createdAt: 3000,
          readAt: null,
        },
        {
          id: '4',
          type: 'info',
          title: 'Info',
          createdAt: 4000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });
    });

    it('excludes read error and warning notifications from count', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Unread Error',
          createdAt: 1000,
          readAt: null,
        },
        {
          id: '2',
          type: 'error',
          title: 'Read Error',
          createdAt: 2000,
          readAt: 2500,
        },
        {
          id: '3',
          type: 'warning',
          title: 'Read Warning',
          createdAt: 3000,
          readAt: 3500,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('displays 99+ when unread count exceeds 99', async () => {
      const notifications: AppNotification[] = Array.from(
        { length: 105 },
        (_, i) => ({
          id: `${i}`,
          type: 'error',
          title: `Error ${i}`,
          createdAt: 1000 + i,
          readAt: null,
        }),
      );
      mockListNotifications.mockResolvedValue(notifications);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('99+')).toBeInTheDocument();
      });
    });

    it('displays exact count of 99 when precisely 99 unread', async () => {
      const notifications: AppNotification[] = Array.from(
        { length: 99 },
        (_, i) => ({
          id: `${i}`,
          type: 'error',
          title: `Error ${i}`,
          createdAt: 1000 + i,
          readAt: null,
        }),
      );
      mockListNotifications.mockResolvedValue(notifications);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('99')).toBeInTheDocument();
      });
    });

    it('shows no count badge when all notifications are read', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Read Error',
          createdAt: 1000,
          readAt: 1500,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(mockListNotifications).toHaveBeenCalled();
      });

      expect(screen.queryByText(/^(\d+|\d+\+)$/)).not.toBeInTheDocument();
    });
  });

  describe('mark all notifications as read', () => {
    it('calls markAllNotificationsRead when button is clicked', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error 1',
          createdAt: 1000,
          readAt: null,
        },
        {
          id: '2',
          type: 'error',
          title: 'Error 2',
          createdAt: 2000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('Mark all read')).toBeInTheDocument();
      });

      const markAllButton = screen.getByText('Mark all read');
      await userEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockMarkAllNotificationsRead).toHaveBeenCalledTimes(1);
      });
    });

    it('updates local state optimistically when marking all as read', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error 1',
          createdAt: 1000,
          readAt: null,
        },
        {
          id: '2',
          type: 'error',
          title: 'Error 2',
          createdAt: 2000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument();
      });

      const markAllButton = screen.getByText('Mark all read');
      await userEvent.click(markAllButton);

      await waitFor(() => {
        expect(screen.queryByText('2')).not.toBeInTheDocument();
      });
    });

    it('disables Mark all read button when no unread notifications', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Read Error',
          createdAt: 1000,
          readAt: 1500,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        const button = screen.getByText('Mark all read');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('clear all notifications', () => {
    it('calls clearNotifications when Clear all button is clicked', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error',
          createdAt: 1000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('Clear all')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear all');
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(mockClearNotifications).toHaveBeenCalledTimes(1);
      });
    });

    it('updates local state optimistically when clearing', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error',
          createdAt: 1000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
      });

      const clearButton = screen.getByText('Clear all');
      await userEvent.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('No notifications.')).toBeInTheDocument();
      });
    });

    it('disables Clear all button when no notifications exist', async () => {
      mockListNotifications.mockResolvedValue([]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        const button = screen.getByText('Clear all');
        expect(button).toBeDisabled();
      });
    });
  });

  describe('notification fetching and refreshing', () => {
    it('fetches notifications on mount', async () => {
      mockListNotifications.mockResolvedValue([]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(mockListNotifications).toHaveBeenCalledTimes(1);
      });
    });

    it('displays empty state when no notifications exist', async () => {
      mockListNotifications.mockResolvedValue([]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('No notifications.')).toBeInTheDocument();
      });
    });

    it('renders notification with title and description', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error Title',
          description: 'Error Description',
          createdAt: 1000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('Error Title')).toBeInTheDocument();
        expect(screen.getByText('Error Description')).toBeInTheDocument();
      });
    });

    it('renders notification without description', async () => {
      mockListNotifications.mockResolvedValue([
        {
          id: '1',
          type: 'error',
          title: 'Error Title',
          createdAt: 1000,
          readAt: null,
        },
      ]);

      const { NotificationCenterButton } = await import(
        '@/renderer/components/notification-center'
      );

      render(<NotificationCenterButton />);

      await waitFor(() => {
        expect(screen.getByText('Error Title')).toBeInTheDocument();
      });
    });
  });
});

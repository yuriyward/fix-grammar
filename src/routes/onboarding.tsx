/**
 * Onboarding / permissions page route component
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getPermissionsStatus,
  type PermissionsStatus,
  requestAccessibilityAccess,
  showTestNotification,
} from '@/actions/permissions';
import { openExternalLink } from '@/actions/shell';
import { Button } from '@/renderer/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/renderer/components/ui/card';

type LoadState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; data: PermissionsStatus }
  | { status: 'error'; message: string };

function formatStatusLabel(value: boolean): string {
  return value ? 'Granted' : 'Not granted';
}

function OnboardingPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: 'idle' });

  const refresh = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const data = await getPermissionsStatus();
      setState({ status: 'ready', data });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setState({ status: 'error', message });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const data = state.status === 'ready' ? state.data : null;
  const isMacOS = data?.platform === 'darwin';

  const canContinue = data?.accessibilityTrusted ?? false;

  const notificationsNote = useMemo(() => {
    if (!isMacOS) return null;
    return (
      <>
        In development, macOS may list the sender as{' '}
        <span className="font-medium">Electron</span>
        (not “Grammar Copilot”). Make sure notifications are allowed for that
        entry.
      </>
    );
  }, [isMacOS]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-6 pt-6">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">Onboarding</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Grant macOS permissions so Grammar Copilot can automate copy/paste
              reliably.
            </p>
          </div>

          <Button variant="outline" onClick={() => void refresh()}>
            Refresh
          </Button>
        </div>

        {state.status === 'error' && (
          <div className="text-destructive mb-4 text-sm">
            Failed to load permissions status: {state.message}
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto px-6 pb-6">
        <Card>
          <CardHeader>
            <CardTitle>Accessibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm">
                Status:{' '}
                <span className="font-medium">
                  {data ? formatStatusLabel(data.accessibilityTrusted) : '—'}
                </span>
              </div>
              {!isMacOS && (
                <div className="text-muted-foreground text-xs">
                  Not required on this platform
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!isMacOS}
                onClick={async () => {
                  await requestAccessibilityAccess(true);
                  await refresh();
                }}
              >
                Request Access
              </Button>
              <Button
                variant="outline"
                disabled={!isMacOS}
                onClick={() =>
                  void openExternalLink(
                    'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility',
                  )
                }
              >
                Open Settings
              </Button>
            </div>

            <p className="text-muted-foreground text-sm">
              This is required for simulating keyboard actions
              (copy/paste/select all).
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              Supported:{' '}
              <span className="font-medium">
                {data ? (data.notificationsSupported ? 'Yes' : 'No') : '—'}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                disabled={!data?.notificationsSupported}
                onClick={async () => {
                  await showTestNotification();
                }}
              >
                Send Test Notification
              </Button>
              <Button
                variant="outline"
                disabled={!isMacOS}
                onClick={() =>
                  void openExternalLink(
                    'x-apple.systempreferences:com.apple.preference.notifications',
                  )
                }
              >
                Open Notifications Settings
              </Button>
            </div>

            {notificationsNote && (
              <p className="text-muted-foreground text-sm">
                {notificationsNote}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 border-t bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <Button variant="outline" onClick={() => navigate({ to: '/settings' })}>
          Open Settings
        </Button>
        <Button disabled={!canContinue} onClick={() => navigate({ to: '/' })}>
          Continue
        </Button>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/onboarding')({
  component: OnboardingPage,
});

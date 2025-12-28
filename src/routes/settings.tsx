/**
 * Settings page route component
 */
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { getAppVersion } from '@/actions/app';
import { Button } from '@/renderer/components/ui/button';
import SettingsForm from '@/renderer/features/settings/settings-form';

function SettingsPage() {
  const navigate = useNavigate();
  const [appVersion, setAppVersion] = useState('0.0.0');

  useEffect(() => {
    getAppVersion().then(setAppVersion);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 border-b px-6 py-3">
        <Button
          variant="ghost"
          onClick={() => navigate({ to: '/' })}
          className="mb-2"
        >
          ← Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-4">
        <SettingsForm />
      </div>

      <footer className="text-muted-foreground flex-shrink-0 border-t px-6 py-3 text-right text-xs opacity-60">
        v{appVersion}
      </footer>
    </div>
  );
}

export const Route = createFileRoute('/settings')({
  component: SettingsPage,
});

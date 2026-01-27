/**
 * Appearance settings section
 * Theme and language toggle UI
 */
import { useState } from 'react';
import { resetBuiltInSkills } from '@/actions/skills';
import LangToggle from '@/renderer/components/lang-toggle';
import ToggleTheme from '@/renderer/components/toggle-theme';
import { Button } from '@/renderer/components/ui/button';
import { Label } from '@/renderer/components/ui/label';
import { Spinner } from '@/renderer/components/ui/spinner';

/**
 * Appearance section component for theme and language settings.
 * This is a simple presentational component with no props.
 */
export function AppearanceSection() {
  const [isResetting, setIsResetting] = useState(false);

  const handleResetSkills = async () => {
    setIsResetting(true);
    try {
      await resetBuiltInSkills();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Appearance</h2>
      <div className="space-y-2">
        <Label>Theme</Label>
        <div className="flex items-center gap-2">
          <ToggleTheme />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Language</Label>
        <div className="flex items-center gap-2">
          <LangToggle />
        </div>
      </div>

      <h2 className="text-lg font-semibold pt-4">Data</h2>
      <div className="space-y-2">
        <Label>Reset Built-in Skills</Label>
        <p className="text-sm text-muted-foreground">
          Restore built-in skills to their default definitions.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleResetSkills}
          disabled={isResetting}
        >
          {isResetting ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="size-4" />
              Resetting…
            </span>
          ) : (
            'Reset Skills'
          )}
        </Button>
      </div>
    </div>
  );
}

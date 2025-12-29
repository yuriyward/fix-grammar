/**
 * Appearance settings section
 * Theme and language toggle UI
 */
import LangToggle from '@/renderer/components/lang-toggle';
import ToggleTheme from '@/renderer/components/toggle-theme';
import { Label } from '@/renderer/components/ui/label';

/**
 * Appearance section component for theme and language settings.
 * This is a simple presentational component with no props.
 */
export function AppearanceSection() {
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
    </div>
  );
}

/**
 * Theme toggle button component
 */
import { Moon } from 'lucide-react';
import { toggleTheme } from '@/actions/theme';
import { Button } from '@/renderer/components/ui/button';

export default function ToggleTheme() {
  return (
    <Button onClick={toggleTheme} size="icon">
      <Moon size={16} />
    </Button>
  );
}

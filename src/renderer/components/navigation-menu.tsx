/**
 * Main app navigation menu component
 */
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Button } from '@/renderer/components/ui/button';
import { cn } from '@/renderer/lib/tailwind';

export default function NavigationMenu() {
  const { t } = useTranslation();
  const router = useRouterState();
  const currentPath = router.location.pathname;

  return (
    <nav className="text-muted-foreground px-2" aria-label="Main navigation">
      <ul className="flex gap-1 list-none m-0 p-0">
        <li>
          <Button
            variant="ghost"
            size="default"
            render={<Link to="/" />}
            className={cn(
              currentPath === '/' && 'bg-accent text-accent-foreground',
            )}
          >
            {t('titleHomePage')}
          </Button>
        </li>
        <li>
          <Button
            variant="ghost"
            size="default"
            render={<Link to="/second" />}
            className={cn(
              currentPath === '/second' && 'bg-accent text-accent-foreground',
            )}
          >
            {t('titleSecondPage')}
          </Button>
        </li>
      </ul>
    </nav>
  );
}

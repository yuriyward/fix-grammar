/**
 * Home page route component
 */
import { SiElectron, SiReact, SiVite } from '@icons-pack/react-simple-icons';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState, useTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { getAppVersion } from '@/actions/app';
import ExternalLink from '@/renderer/components/external-link';
import LangToggle from '@/renderer/components/lang-toggle';
import NavigationMenu from '@/renderer/components/navigation-menu';
import ToggleTheme from '@/renderer/components/toggle-theme';

/*
 * Update this page to modify your home page.
 * You can delete this file component to start from a blank page.
 */

function HomePage() {
  const iconSize = 48;

  const [appVersion, setAppVersion] = useState('0.0.0');
  const [, startGetAppVersion] = useTransition();
  const { t } = useTranslation();

  useEffect(
    () => startGetAppVersion(() => getAppVersion().then(setAppVersion)),
    [],
  );

  return (
    <>
      <NavigationMenu />
      <div className="flex h-full flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <div className="inline-flex gap-2">
            <SiReact size={iconSize} />
            <SiVite size={iconSize} />
            <SiElectron size={iconSize} />
          </div>
          <span>
            <h1 className="font-mono text-4xl font-bold">{t('appName')}</h1>
            <p
              className="text-muted-foreground text-end text-sm uppercase"
              data-testid="pageTitle"
            >
              {t('titleHomePage')}
            </p>
          </span>
          <LangToggle />
          <ToggleTheme />
        </div>
        <footer className="font-tomorrow text-muted-foreground flex justify-between text-[0.7rem] uppercase">
          <ExternalLink href="https://littlebit.dev">
            {t('madeBy')}
          </ExternalLink>
          <p>
            {t('version')}: v{appVersion}
          </p>
        </footer>
      </div>
    </>
  );
}

export const Route = createFileRoute('/')({
  component: HomePage,
});

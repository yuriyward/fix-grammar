/**
 * Root route with base layout wrapper
 */
import {
  createRootRoute,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { getPermissionsStatus } from '@/actions/permissions';
import BaseLayout from '@/renderer/layouts/base-layout';

/* import { TanStackRouterDevtools } from '@tanstack/react-router-devtools' */

/*
 * Uncomment the code in this file to enable the router devtools.
 */

function Root() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (routerState) => routerState.location.pathname,
  });
  const [accessibilityTrusted, setAccessibilityTrusted] = useState<
    boolean | null
  >(null);

  const refreshPermissions = useCallback(async () => {
    const status = await getPermissionsStatus();
    setAccessibilityTrusted(status.accessibilityTrusted);
  }, []);

  useEffect(() => {
    void refreshPermissions();
  }, [refreshPermissions]);

  useEffect(() => {
    const onFocus = () => {
      void refreshPermissions();
    };

    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshPermissions]);

  useEffect(() => {
    if (accessibilityTrusted !== false) return;

    const allowedPaths = new Set(['/onboarding', '/settings', '/popup']);
    if (allowedPaths.has(pathname)) return;

    void navigate({ to: '/onboarding', replace: true });
  }, [accessibilityTrusted, navigate, pathname]);

  return (
    <BaseLayout>
      <Outlet />
      {/* Uncomment the following line to enable the router devtools */}
      {/* <TanStackRouterDevtools /> */}
    </BaseLayout>
  );
}

export const Route = createRootRoute({
  component: Root,
});

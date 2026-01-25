/**
 * TanStack Router configuration
 *
 * Uses hash history to support multiple Electron windows with independent routes.
 * Each window can load with a different hash (e.g., #/popup, #/settings) and the
 * router will initialize to that route automatically. Memory history would force
 * all windows to start at the same initial route.
 */
import { createHashHistory, createRouter } from '@tanstack/react-router';
import { routeTree } from '@/routeTree.gen';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export const router = createRouter({
  defaultPendingMinMs: 0,
  routeTree,
  history: createHashHistory(),
});

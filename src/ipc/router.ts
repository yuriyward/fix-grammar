/**
 * Root oRPC router combining all domains
 */
import { app } from './app/router';
import { shell } from './shell/router';
import { theme } from './theme/router';
import { window } from './window/router';

export const router = {
  theme,
  window,
  app,
  shell,
};

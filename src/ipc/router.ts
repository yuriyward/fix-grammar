/**
 * Root oRPC router combining all domains
 */
import { ai } from './ai/router';
import { app } from './app/router';
import { automation } from './automation/router';
import { notifications } from './notifications/router';
import { permissions } from './permissions/router';
import { settings } from './settings/router';
import { shell } from './shell/router';
import { shortcuts } from './shortcuts/router';
import { theme } from './theme/router';
import { window } from './window/router';

export const router = {
  theme,
  window,
  app,
  shell,
  settings,
  automation,
  ai,
  shortcuts,
  notifications,
  permissions,
};

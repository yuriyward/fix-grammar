/**
 * macOS app context utilities for tracking frontmost application
 */
import { execFile } from 'node:child_process';

const OSASCRIPT_PATH = '/usr/bin/osascript';

const GET_FRONTMOST_APP_SCRIPT = `
tell application "System Events"
  set frontApp to first application process whose frontmost is true
  set appName to name of frontApp
  set appBundleId to bundle identifier of frontApp
  return appName & "|" & appBundleId
end tell
`;

const ACTIVATE_APP_BY_ID_SCRIPT = `
on run argv
  set identifier to item 1 of argv
  tell application id identifier
    activate
  end tell
end run
`;

const ACTIVATE_APP_BY_NAME_SCRIPT = `
on run argv
  set appName to item 1 of argv
  tell application appName
    activate
  end tell
end run
`;

function runAppleScript(
  script: string,
  args: readonly string[] = [],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const osascriptArgs = [
      '-e',
      script,
      ...(args.length > 0 ? ['--', ...args] : []),
    ];

    execFile(
      OSASCRIPT_PATH,
      osascriptArgs,
      { encoding: 'utf8' },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(stdout);
      },
    );
  });
}

export interface AppContext {
  name: string;
  bundleId?: string | undefined;
  timestamp: number;
}

/**
 * Get the currently frontmost (focused) application on macOS
 * Uses AppleScript to query System Events for the frontmost process
 */
export async function getFrontmostApp(): Promise<AppContext | null> {
  try {
    const output = (await runAppleScript(GET_FRONTMOST_APP_SCRIPT)).trim();

    if (!output) return null;

    const parts = output.split('|');
    if (parts.length !== 2) {
      console.error('[app-context] Unexpected output format:', output);
      return null;
    }
    const [name, bundleId] = parts;

    return {
      name: name?.trim() || '',
      bundleId: bundleId?.trim(),
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[app-context] Failed to get frontmost app:', error);
    return null;
  }
}

/**
 * Compare two app contexts for equality
 * Matches on app name and bundle ID (if available)
 */
export function isSameApp(a: AppContext | null, b: AppContext | null): boolean {
  if (!a || !b) return false;

  // Primary match: bundle ID (most reliable)
  if (a.bundleId && b.bundleId) {
    return a.bundleId === b.bundleId;
  }

  // Fallback match: app name
  return a.name === b.name;
}

/**
 * Switch to (activate) the specified app on macOS
 * Uses AppleScript to activate the application
 */
export async function switchToApp(context: AppContext): Promise<void> {
  try {
    // Prefer bundle ID for activation (more reliable)
    const identifier = context.bundleId || context.name;

    await runAppleScript(ACTIVATE_APP_BY_ID_SCRIPT, [identifier]);
  } catch (error) {
    // If bundle ID fails, try app name as fallback
    if (context.bundleId && context.name) {
      try {
        await runAppleScript(ACTIVATE_APP_BY_NAME_SCRIPT, [context.name]);
        return;
      } catch (fallbackError) {
        console.error('[app-context] Failed to switch to app:', fallbackError);
        throw fallbackError;
      }
    }

    console.error('[app-context] Failed to switch to app:', error);
    throw error;
  }
}

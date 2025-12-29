/**
 * macOS app context utilities for tracking frontmost application
 */
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export interface AppContext {
  name: string;
  bundleId?: string;
  timestamp: number;
}

/**
 * Get the currently frontmost (focused) application on macOS
 * Uses AppleScript to query System Events for the frontmost process
 */
export async function getFrontmostApp(): Promise<AppContext | null> {
  try {
    const script = `
      tell application "System Events"
        set frontApp to first application process whose frontmost is true
        set appName to name of frontApp
        set appBundleId to bundle identifier of frontApp
        return appName & "|" & appBundleId
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const output = stdout.trim();

    if (!output) return null;

    const [name, bundleId] = output.split('|');

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

    const script = `
      tell application id "${identifier}"
        activate
      end tell
    `;

    await execAsync(`osascript -e '${script}'`);
  } catch (error) {
    // If bundle ID fails, try app name as fallback
    if (context.bundleId && context.name) {
      try {
        const fallbackScript = `
          tell application "${context.name}"
            activate
          end tell
        `;
        await execAsync(`osascript -e '${fallbackScript}'`);
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

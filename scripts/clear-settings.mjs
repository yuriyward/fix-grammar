#!/usr/bin/env node
/**
 * Clear all application settings and cached data
 */
import { existsSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const appName = 'electron-shadcn-ai';

function getConfigDir(name) {
  switch (process.platform) {
    case 'darwin':
      return join(homedir(), 'Library', 'Application Support', name);
    case 'win32': {
      const appData =
        process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming');
      return join(appData, name);
    }
    default: {
      const configHome =
        process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
      return join(configHome, name);
    }
  }
}

const configDir = getConfigDir(appName);

console.log('🧹 Clearing application settings...');
console.log(`📁 Config directory: ${configDir}`);

if (existsSync(configDir)) {
  try {
    // Remove the entire application data directory
    rmSync(configDir, { recursive: true, force: true });
    console.log('✅ Settings cleared successfully!');
    console.log('\n💡 Restart the app to create fresh settings.');
  } catch (error) {
    console.error('❌ Failed to clear settings:', error.message);
    process.exit(1);
  }
} else {
  console.log('ℹ️  No settings found to clear.');
}

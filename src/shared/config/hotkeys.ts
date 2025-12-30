/**
 * Hotkey configuration constants
 */

/**
 * Valid hotkey modifier keys (case-insensitive)
 * These can appear anywhere before the final key in a hotkey sequence
 */
export const HOTKEY_MODIFIERS = new Set<string>([
  'commandorcontrol',
  'cmdorctrl',
  'command',
  'cmd',
  'control',
  'ctrl',
  'alt',
  'option',
  'altgr',
  'shift',
  'super',
  'meta',
]);

/**
 * Valid named keys (case-insensitive)
 * These can appear as the final key in a hotkey sequence
 */
export const HOTKEY_NAMED_KEYS = new Set<string>([
  'plus',
  'space',
  'tab',
  'backspace',
  'delete',
  'insert',
  'return',
  'enter',
  'up',
  'down',
  'left',
  'right',
  'home',
  'end',
  'pageup',
  'pagedown',
  'escape',
  'esc',
  'volumeup',
  'volumedown',
  'volumemute',
  'medianexttrack',
  'mediaprevioustrack',
  'mediastop',
  'mediaplaypause',
  'printscreen',
]);

/**
 * Default hotkey configurations
 */
export const DEFAULT_HOTKEYS = {
  /** Default shortcut for selection fix */
  fixSelection: 'CommandOrControl+Shift+D',
  /** Default shortcut for popup toggle */
  togglePopup: 'CommandOrControl+Shift+I',
} as const;

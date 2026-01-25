/**
 * IPC channel names and storage keys
 */
export const LOCAL_STORAGE_KEYS = {
  LANGUAGE: 'lang',
  THEME: 'theme',
  SIDEBAR: 'sidebar_state',
};

export const IPC_CHANNELS = {
  START_ORPC_SERVER: 'start-orpc-server',
  NAVIGATE: 'app:navigate',
  NOTIFY: 'app:notify',
  OPEN_NOTIFICATIONS: 'app:open-notifications',
  AUTOMATION_CALIBRATION_FOCUS_REQUEST: 'automation:calibration-focus-request',
  AUTOMATION_CALIBRATION_FOCUS_RESPONSE:
    'automation:calibration-focus-response',
  CHAT_STREAM: 'chat:stream',
  CHAT_CONVERSATIONS_CHANGED: 'chat:conversations-changed',
  CHAT_CONVERSATION_SELECTED: 'chat:conversation-selected',
};

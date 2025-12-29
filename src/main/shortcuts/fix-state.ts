/**
 * State manager for grammar fix operations
 * Prevents concurrent fix requests (one at a time)
 */
import type { AppContext } from './app-context';

interface FixState {
  isProcessing: boolean;
  contextId: string | null;
  sourceApp: AppContext | null;
}

class FixStateManager {
  private state: FixState = {
    isProcessing: false,
    contextId: null,
    sourceApp: null,
  };

  /**
   * Check if a new fix can be started
   * Returns false if a fix is already in progress
   */
  canStartFix(): boolean {
    return !this.state.isProcessing;
  }

  /**
   * Start a new fix operation
   * Should only be called after canStartFix() returns true
   */
  startFix(contextId: string, sourceApp: AppContext | null): void {
    if (this.state.isProcessing) {
      console.warn(
        '[fix-state] Attempted to start fix while already processing',
      );
      return;
    }

    this.state = {
      isProcessing: true,
      contextId,
      sourceApp,
    };
  }

  /**
   * Mark the current fix operation as complete
   * Resets state to allow new fixes
   */
  completeFix(): void {
    this.state = {
      isProcessing: false,
      contextId: null,
      sourceApp: null,
    };
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<FixState> {
    return { ...this.state };
  }
}

export const fixStateManager = new FixStateManager();

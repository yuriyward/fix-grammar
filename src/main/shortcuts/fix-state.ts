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
   * Atomically try to acquire the fix lock.
   * Returns true if lock was acquired, false if already processing.
   * This prevents TOCTOU race conditions between check and start.
   */
  tryAcquire(): boolean {
    if (this.state.isProcessing) {
      return false;
    }

    this.state.isProcessing = true;
    return true;
  }

  /**
   * Set context data for the current fix operation.
   * Must be called after tryAcquire() returns true.
   */
  setContext(contextId: string, sourceApp: AppContext | null): void {
    this.state.contextId = contextId;
    this.state.sourceApp = sourceApp;
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

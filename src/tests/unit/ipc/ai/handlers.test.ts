/**
 * AI IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRewriteTextWithSettings } = vi.hoisted(() => ({
  mockRewriteTextWithSettings: vi.fn(),
}));

const { mockShowNotification } = vi.hoisted(() => ({
  mockShowNotification: vi.fn(),
}));

vi.mock('@/main/ai/client', () => ({
  rewriteTextWithSettings: mockRewriteTextWithSettings,
}));

vi.mock('@/main/utils/notifications', () => ({
  showNotification: mockShowNotification,
}));

vi.mock('@/main/ai/error-handler', () => ({
  parseAIError: () => ({ title: 'Test Error', message: 'Test message' }),
}));

async function* textStream(
  chunks: string[],
  throwAfterChunks?: number,
): AsyncGenerator<string> {
  for (let index = 0; index < chunks.length; index += 1) {
    if (throwAfterChunks !== undefined && index === throwAfterChunks) {
      throw new Error('stream failed');
    }
    yield chunks[index] ?? '';
  }
}

describe('AI IPC handlers', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('throws when API key is missing for provider', async () => {
    mockRewriteTextWithSettings.mockRejectedValue(
      new Error('API key not found for provider: google'),
    );

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Hello', role: 'grammar' }),
    ).rejects.toThrow('API key not found for provider: google');
  });

  it('rewrites text by concatenating all stream chunks', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['A', 'B', 'C']),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Hello', role: 'grammar-tone' }),
    ).resolves.toEqual({
      content: 'ABC',
    });
    expect(mockRewriteTextWithSettings).toHaveBeenCalledWith(
      'Hello',
      'grammar-tone',
    );
  });

  it('shows notification and throws when stream fails before yielding any chunk', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['unused'], 0),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Original', role: 'grammar' }),
    ).rejects.toThrow('AI rewrite failed: Test message');

    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Test Error',
      description: 'Test message',
    });
  });

  it('shows notification and returns partial text when stream fails after some chunks', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['Partial', 'Ignored'], 1),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Original', role: 'grammar' }),
    ).resolves.toEqual({
      content: 'Partial',
    });

    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Test Error',
      description: 'Test message',
    });
  });

  it('validates input schema and rejects empty text', async () => {
    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: '', role: 'grammar' }),
    ).rejects.toBeInstanceOf(Error);
    expect(mockRewriteTextWithSettings).not.toHaveBeenCalled();
  });
});

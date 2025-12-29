/**
 * AI IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRewriteTextWithSettings } = vi.hoisted(() => ({
  mockRewriteTextWithSettings: vi.fn(),
}));

vi.mock('@/main/ai/client', () => ({
  rewriteTextWithSettings: mockRewriteTextWithSettings,
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

  it('falls back to original text when stream fails before yielding any chunk', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['unused'], 0),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Original', role: 'grammar' }),
    ).resolves.toEqual({
      content: 'Original',
    });
  });

  it('returns partial text when stream fails after some chunks', async () => {
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

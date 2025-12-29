/**
 * AI IPC handlers tests
 */
import { createProcedureClient } from '@orpc/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockRewriteText, mockGetApiKey, mockStoreGet } = vi.hoisted(() => ({
  mockRewriteText: vi.fn(),
  mockGetApiKey: vi.fn(),
  mockStoreGet: vi.fn(),
}));

vi.mock('@/main/ai/client', () => ({
  rewriteText: mockRewriteText,
}));

vi.mock('@/main/storage/api-keys', () => ({
  getApiKey: mockGetApiKey,
}));

vi.mock('@/main/storage/settings', () => ({
  store: {
    get: mockStoreGet,
  },
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
    mockStoreGet.mockImplementation((key: string) => {
      if (key === 'ai.provider') return 'google';
      if (key === 'ai.model') return 'gemini-3-flash-preview';
      return undefined;
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('throws when API key is missing for provider', async () => {
    mockGetApiKey.mockReturnValue(undefined);

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Hello', role: 'grammar' }),
    ).rejects.toThrow('API key not found for provider: google');
    expect(mockRewriteText).not.toHaveBeenCalled();
  });

  it('rewrites text by concatenating all stream chunks', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockRewriteText.mockResolvedValue({
      textStream: textStream(['A', 'B', 'C']),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: 'Hello', role: 'grammar-tone' }),
    ).resolves.toEqual({
      content: 'ABC',
    });
    expect(mockRewriteText).toHaveBeenCalledWith(
      'Hello',
      'grammar-tone',
      'test-key',
      'gemini-3-flash-preview',
      'google',
    );
  });

  it('falls back to original text when stream fails before yielding any chunk', async () => {
    mockGetApiKey.mockReturnValue('test-key');
    mockRewriteText.mockResolvedValue({
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
    mockGetApiKey.mockReturnValue('test-key');
    mockRewriteText.mockResolvedValue({
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
    mockGetApiKey.mockReturnValue('test-key');

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({ text: '', role: 'grammar' }),
    ).rejects.toBeInstanceOf(Error);
    expect(mockRewriteText).not.toHaveBeenCalled();
  });
});

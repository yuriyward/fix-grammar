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

vi.mock('@/main/ai/langfuse', () => ({
  extractTokenUsage: vi.fn(() => undefined),
  traceRewrite: vi.fn(),
}));

vi.mock('@/main/ai/prompts', () => ({
  buildPrompt: vi.fn(() => 'mocked-prompt'),
}));

vi.mock('@/main/storage/settings', () => ({
  store: { get: vi.fn(() => 'google') },
}));

vi.mock('@/main/storage/skills', () => ({
  getSkill: vi.fn(() => ({
    id: 'test-id',
    name: 'Grammar',
    prompt: 'Fix grammar',
  })),
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
      callRewrite({
        text: 'Hello',
        skillId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow('API key not found for provider: google');
  });

  it('rewrites text by concatenating all stream chunks', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['A', 'B', 'C']),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({
        text: 'Hello',
        skillId: '00000000-0000-4000-8000-000000000002',
      }),
    ).resolves.toEqual({
      content: 'ABC',
    });
    expect(mockRewriteTextWithSettings).toHaveBeenCalledWith(
      'Hello',
      '00000000-0000-4000-8000-000000000002',
    );
  });

  it('shows notification and throws when stream fails before yielding any chunk', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['unused'], 0),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({
        text: 'Original',
        skillId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow('AI rewrite failed: Test message');

    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Test Error',
      description: 'Test message',
    });
  });

  it('shows notification and throws when stream fails after some chunks (discards partial content)', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['Partial', 'Ignored'], 1),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({
        text: 'Original',
        skillId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toThrow(
      'AI rewrite failed: Test message (7 chars received before failure)',
    );

    expect(mockShowNotification).toHaveBeenCalledWith({
      type: 'error',
      title: 'Test Error',
      description: 'Test message',
    });
  });

  it('returns full content when stream completes successfully', async () => {
    mockRewriteTextWithSettings.mockResolvedValue({
      textStream: textStream(['Hello', ' ', 'World']),
    });

    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({
        text: 'Test input',
        skillId: '00000000-0000-4000-8000-000000000001',
      }),
    ).resolves.toEqual({
      content: 'Hello World',
    });

    expect(mockShowNotification).not.toHaveBeenCalled();
  });

  it('validates input schema and rejects empty text', async () => {
    const { rewriteTextHandler } = await import('@/ipc/ai/handlers');
    const callRewrite = createProcedureClient(rewriteTextHandler);

    await expect(
      callRewrite({
        text: '',
        skillId: '00000000-0000-4000-8000-000000000001',
      }),
    ).rejects.toBeInstanceOf(Error);
    expect(mockRewriteTextWithSettings).not.toHaveBeenCalled();
  });
});

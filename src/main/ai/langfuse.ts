/**
 * Langfuse observability client for AI tracing
 */
import { app } from 'electron';
import { Langfuse } from 'langfuse';
import { getApiKey } from '@/main/storage/api-keys';
import { store } from '@/main/storage/settings';
import type { AIProvider } from '@/shared/config/ai-models';
import type { RewriteRole } from '@/shared/types/ai';

const LANGFUSE_BASE_URL = 'https://cloud.langfuse.com';

let client: Langfuse | null = null;

function getClient(): Langfuse | null {
  if (client) return client;

  const enabled = store.get('langfuse.enabled') as boolean | undefined;
  if (!enabled) return null;

  const publicKey = getApiKey('langfuse-public');
  const secretKey = getApiKey('langfuse-secret');
  if (!publicKey || !secretKey) return null;

  client = new Langfuse({
    publicKey,
    secretKey,
    baseUrl: LANGFUSE_BASE_URL,
  });

  return client;
}

export function resetLangfuseClient(): void {
  if (client) {
    client.flushAsync().catch((err) => {
      console.warn('[Langfuse] Flush failed during reset:', err);
    });
    client = null;
  }
}

/**
 * Shutdown Langfuse client, returning a promise that resolves when flush completes.
 * Use this for graceful shutdown to ensure pending traces are sent.
 */
export async function shutdownLangfuse(): Promise<void> {
  if (client) {
    await client.flushAsync().catch((err) => {
      console.warn('[Langfuse] Flush failed during shutdown:', err);
    });
    client = null;
  }
}

interface TokenUsage {
  input: number;
  output: number;
  total: number;
}

/**
 * Extracts Langfuse-compatible token usage from AI SDK usage data.
 * Returns undefined when the provider doesn't report valid token counts (e.g. LM Studio).
 */
export function extractTokenUsage(
  rawUsage:
    | {
        inputTokens: number | undefined;
        outputTokens: number | undefined;
        totalTokens: number | undefined;
      }
    | undefined,
): TokenUsage | undefined {
  if (!rawUsage) return undefined;

  const { inputTokens, outputTokens, totalTokens } = rawUsage;
  if (!Number.isFinite(inputTokens) || !Number.isFinite(outputTokens)) {
    return undefined;
  }

  const input = inputTokens as number;
  const output = outputTokens as number;
  return { input, output, total: totalTokens ?? input + output };
}

interface TraceRewriteParams {
  input: string;
  output: string;
  prompt: string;
  model: string;
  provider: AIProvider;
  role: RewriteRole;
  usage?: TokenUsage;
}

export function traceRewrite(params: TraceRewriteParams): void {
  const langfuse = getClient();
  if (!langfuse) return;

  try {
    const trace = langfuse.trace({
      name: 'rewrite',
      input: params.input,
      output: params.output,
      metadata: {
        provider: params.provider,
        model: params.model,
        role: params.role,
        appVersion: app.getVersion(),
      },
    });

    trace.generation({
      name: 'rewrite-generation',
      model: params.model,
      input: params.prompt,
      output: params.output,
      metadata: {
        provider: params.provider,
        role: params.role,
      },
      ...(params.usage && { usage: params.usage }),
    });
  } catch (error) {
    console.warn('[Langfuse] Failed to trace rewrite:', error);
  }
}

interface TraceChatParams {
  messages: Array<{ role: string; content: string }>;
  systemPrompt: string;
  output: string;
  model: string;
  provider: AIProvider;
  conversationId: string;
  usage?: TokenUsage;
}

export function traceChat(params: TraceChatParams): void {
  const langfuse = getClient();
  if (!langfuse) return;

  try {
    const trace = langfuse.trace({
      name: 'chat',
      sessionId: params.conversationId,
      input: params.messages,
      output: params.output,
      metadata: {
        provider: params.provider,
        model: params.model,
        appVersion: app.getVersion(),
      },
    });

    trace.generation({
      name: 'chat-generation',
      model: params.model,
      input: [
        { role: 'system', content: params.systemPrompt },
        ...params.messages,
      ],
      output: params.output,
      metadata: {
        provider: params.provider,
        conversationId: params.conversationId,
      },
      ...(params.usage && { usage: params.usage }),
    });
  } catch (error) {
    console.warn('[Langfuse] Failed to trace chat:', error);
  }
}

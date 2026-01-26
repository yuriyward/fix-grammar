/**
 * Langfuse observability client for AI tracing
 */
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
    client.flushAsync().catch(() => {});
    client = null;
  }
}

export function shutdownLangfuse(): void {
  if (client) {
    client.flushAsync().catch(() => {});
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
  if (!rawUsage) {
    console.log('[Langfuse] No usage data from AI SDK');
    return undefined;
  }

  const { inputTokens, outputTokens, totalTokens } = rawUsage;
  if (!Number.isFinite(inputTokens) || !Number.isFinite(outputTokens)) {
    console.log('[Langfuse] Invalid token values:', JSON.stringify(rawUsage));
    return undefined;
  }

  const input = inputTokens as number;
  const output = outputTokens as number;
  const usage = { input, output, total: totalTokens ?? input + output };
  console.log('[Langfuse] Token usage:', JSON.stringify(usage));
  return usage;
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

/**
 * AI types
 */
export type RewriteRole = 'grammar' | 'grammar-tone';

export interface StreamChunk {
  type: 'delta' | 'complete' | 'error';
  content: string;
}

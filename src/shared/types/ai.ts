/**
 * AI types
 */
export interface StreamChunk {
  type: 'delta' | 'complete' | 'error';
  content: string;
}

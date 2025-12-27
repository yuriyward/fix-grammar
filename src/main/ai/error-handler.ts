/**
 * AI error handling utilities
 */

export interface AIErrorDetails {
  title: string;
  message: string;
  isRecoverable: boolean;
}

/**
 * Analyzes an AI SDK error and returns user-friendly error details.
 */
export function parseAIError(error: unknown): AIErrorDetails {
  if (!(error instanceof Error)) {
    return {
      title: 'Grammar Copilot Error',
      message: 'An unknown error occurred',
      isRecoverable: false,
    };
  }

  const errorMessage = error.message.toLowerCase();
  const errorName = error.name.toLowerCase();

  // Check for authentication/API key errors (401)
  if (
    errorMessage.includes('unauthorized') ||
    errorMessage.includes('invalid api key') ||
    errorMessage.includes('api key') ||
    errorMessage.includes('authentication') ||
    errorMessage.includes('401')
  ) {
    return {
      title: 'Invalid API Key',
      message:
        'Your API key is invalid or missing. Please check your settings.',
      isRecoverable: true,
    };
  }

  // Check for quota/rate limit errors (429)
  if (
    errorMessage.includes('quota') ||
    errorMessage.includes('rate limit') ||
    errorMessage.includes('too many requests') ||
    errorMessage.includes('429')
  ) {
    return {
      title: 'Quota Exceeded',
      message: 'API quota or rate limit exceeded. Please try again later.',
      isRecoverable: true,
    };
  }

  // Check for network errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('enotfound') ||
    errorMessage.includes('econnrefused') ||
    errorMessage.includes('timeout') ||
    errorName.includes('network')
  ) {
    return {
      title: 'Network Error',
      message:
        'Failed to connect to AI service. Check your internet connection.',
      isRecoverable: true,
    };
  }

  // Check for invalid request errors (400)
  if (
    errorMessage.includes('invalid request') ||
    errorMessage.includes('bad request') ||
    errorMessage.includes('400')
  ) {
    return {
      title: 'Invalid Request',
      message: 'The request was invalid. Please check your AI model settings.',
      isRecoverable: true,
    };
  }

  // Check for server errors (500+)
  if (
    errorMessage.includes('server error') ||
    errorMessage.includes('internal error') ||
    errorMessage.includes('500') ||
    errorMessage.includes('502') ||
    errorMessage.includes('503')
  ) {
    return {
      title: 'Service Unavailable',
      message: 'AI service is temporarily unavailable. Please try again later.',
      isRecoverable: true,
    };
  }

  // Generic fallback
  return {
    title: 'Grammar Copilot Error',
    message: `Rewrite failed: ${error.message}`,
    isRecoverable: false,
  };
}

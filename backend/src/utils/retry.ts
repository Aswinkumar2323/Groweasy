import logger from './logger';

/**
 * Retry a function with exponential backoff
 * @param fn - Async function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in ms (default: 1000)
 * @param context - Context string for logging
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation',
  onRetry?: (delayMs: number, attempt: number, maxRetries: number, isRateLimit: boolean) => void
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        let delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
        const errorMessage = lastError.message;
        
        let isRateLimit = false;
        // Handle 429 Too Many Requests / Quota limits
        if (errorMessage.includes('429') || errorMessage.includes('Quota exceeded')) {
          isRateLimit = true;
          // Try to extract exact wait time if provided by Google API (e.g., "Please retry in 54.014s")
          const match = errorMessage.match(/Please retry in ([\d\.]+)s/);
          if (match && match[1]) {
            const seconds = parseFloat(match[1]);
            delay = (seconds + 1) * 1000; // Add 1s buffer
          } else {
            delay = 60000; // Default to 60s if we can't parse the specific time
          }
          logger.warn(`Rate limit hit during ${context}. Waiting ${Math.round(delay/1000)}s before retry...`);
        } else {
          logger.warn(
            `${context} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`,
            { error: errorMessage }
          );
        }

        if (onRetry) {
          onRetry(delay, attempt + 1, maxRetries, isRateLimit);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.error(`${context} failed after ${maxRetries + 1} attempts`, {
    error: lastError?.message,
  });
  throw lastError;
}

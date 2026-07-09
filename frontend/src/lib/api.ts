import { ImportResult, ParseResult, ProgressUpdate } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://groweasy-qulv.vercel.app';

/**
 * Upload a CSV file to the backend for parsing
 */
export async function uploadCSV(file: File): Promise<ParseResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/api/import/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || `Upload failed with status ${response.status}`);
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Upload failed');
  }

  return data.data;
}

/**
 * Process CSV data with AI extraction using Server-Sent Events for progress
 */
export function processCSVWithProgress(
  headers: string[],
  rows: Record<string, string>[],
  onProgress: (update: ProgressUpdate) => void,
  onComplete: (result: ImportResult) => void,
  onError: (error: string) => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/import/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({ headers, rows }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Processing failed' }));
        throw new Error(error.error || `Processing failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response stream available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6)) as ProgressUpdate;

              switch (data.type) {
                case 'progress':
                  onProgress(data);
                  break;
                case 'complete':
                  if (data.result) {
                    onComplete(data.result);
                  }
                  break;
                case 'error':
                  onError(data.message || 'Processing failed');
                  break;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError(error instanceof Error ? error.message : 'Processing failed');
      }
    }
  })();

  // Return abort function
  return () => controller.abort();
}

/**
 * Process CSV data with AI extraction (non-streaming fallback)
 */
export async function processCSV(
  headers: string[],
  rows: Record<string, string>[]
): Promise<ImportResult> {
  const response = await fetch(`${API_BASE}/api/import/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ headers, rows }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Processing failed' }));
    throw new Error(error.error || `Processing failed with status ${response.status}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}

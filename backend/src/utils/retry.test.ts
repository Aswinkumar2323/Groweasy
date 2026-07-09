import { describe, it, expect, vi } from 'vitest';
import { withRetry } from './retry';

describe('Retry Utility', () => {
  it('should resolve immediately if the function succeeds on the first try', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    
    const promise = withRetry(fn, 3, 5);
    
    await expect(promise).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry and resolve if the function fails then succeeds', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockResolvedValueOnce('success');
    
    const promise = withRetry(fn, 3, 5, 'Test Operation');
    
    await expect(promise).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw an error if the function fails consistently', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('persistent failure'));
    
    const promise = withRetry(fn, 2, 5);
    
    await expect(promise).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

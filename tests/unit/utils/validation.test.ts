import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';

describe('Environment variable validation', () => {
  const testScript = (
    envVars: Record<string, string>
  ): Promise<{ success: boolean; error: string | null }> => {
    return new Promise((resolve) => {
      const child = spawn(process.execPath, ['-e', "import('./dist/utils/constants.js')"], {
        env: { ...process.env, ...envVars },
        stdio: 'pipe',
      });

      let stderr = '';
      let stdout = '';

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, error: null });
        } else {
          resolve({
            success: false,
            error: stderr || stdout || 'Unknown error',
          });
        }
      });

      child.on('error', (err) => {
        resolve({
          success: false,
          error: err.message,
        });
      });
    });
  };

  describe('PORT validation', () => {
    it('should reject PORT with trailing characters', async () => {
      const result = await testScript({ PORT: '3000junk' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
      expect(result.error).toContain('no extra characters');
    });

    it('should reject PORT=0', async () => {
      const result = await testScript({ PORT: '0' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
      expect(result.error).toContain('greater than 0');
    });

    it('should reject PORT=-1', async () => {
      const result = await testScript({ PORT: '-1' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
    });

    it('should reject PORT=65536 (above maximum)', async () => {
      const result = await testScript({ PORT: '65536' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
      expect(result.error).toContain('between 1 and 65535');
    });

    it('should reject PORT=100000', async () => {
      const result = await testScript({ PORT: '100000' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
      expect(result.error).toContain('between 1 and 65535');
    });

    it('should reject empty PORT', async () => {
      const result = await testScript({ PORT: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid PORT');
      expect(result.error).toContain('empty string');
    });

    it('should accept valid PORT=8080', async () => {
      const result = await testScript({ PORT: '8080' });
      expect(result.success).toBe(true);
    });

    it('should accept PORT=65535 (maximum valid)', async () => {
      const result = await testScript({ PORT: '65535' });
      expect(result.success).toBe(true);
    });
  });

  describe('REQUEST_TIMEOUT validation', () => {
    it('should reject REQUEST_TIMEOUT=1e4 (scientific notation)', async () => {
      const result = await testScript({ REQUEST_TIMEOUT: '1e4' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid REQUEST_TIMEOUT');
      expect(result.error).toContain('no extra characters');
    });

    it('should reject REQUEST_TIMEOUT with trailing text', async () => {
      const result = await testScript({ REQUEST_TIMEOUT: '10000ms' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid REQUEST_TIMEOUT');
      expect(result.error).toContain('no extra characters');
    });

    it('should reject REQUEST_TIMEOUT=0', async () => {
      const result = await testScript({ REQUEST_TIMEOUT: '0' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid REQUEST_TIMEOUT');
      expect(result.error).toContain('greater than 0');
    });

    it('should reject empty REQUEST_TIMEOUT', async () => {
      const result = await testScript({ REQUEST_TIMEOUT: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid REQUEST_TIMEOUT');
      expect(result.error).toContain('empty string');
    });

    it('should accept valid REQUEST_TIMEOUT=15000', async () => {
      const result = await testScript({ REQUEST_TIMEOUT: '15000' });
      expect(result.success).toBe(true);
    });
  });

  describe('MAX_IMAGE_SIZE validation', () => {
    it('should reject MAX_IMAGE_SIZE with suffix', async () => {
      const result = await testScript({ MAX_IMAGE_SIZE: '5000000MB' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid MAX_IMAGE_SIZE');
      expect(result.error).toContain('no extra characters');
    });

    it('should reject MAX_IMAGE_SIZE=0', async () => {
      const result = await testScript({ MAX_IMAGE_SIZE: '0' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid MAX_IMAGE_SIZE');
      expect(result.error).toContain('greater than 0');
    });

    it('should reject empty MAX_IMAGE_SIZE', async () => {
      const result = await testScript({ MAX_IMAGE_SIZE: '' });
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid MAX_IMAGE_SIZE');
      expect(result.error).toContain('empty string');
    });

    it('should accept valid MAX_IMAGE_SIZE=5242880', async () => {
      const result = await testScript({ MAX_IMAGE_SIZE: '5242880' });
      expect(result.success).toBe(true);
    });
  });

  describe('Safe integer validation', () => {
    it('should reject values exceeding Number.MAX_SAFE_INTEGER', async () => {
      const unsafeValue = (Number.MAX_SAFE_INTEGER + 1).toString();
      const result = await testScript({ MAX_IMAGE_SIZE: unsafeValue });
      expect(result.success).toBe(false);
      expect(result.error).toContain('safe integer range');
    });
  });
});

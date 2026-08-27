import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/physics/**', 'src/lib/**', 'src/components/windows/features/cryptography/**', 'src/components/windows/features/networking/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});

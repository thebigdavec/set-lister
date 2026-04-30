import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['app/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['app/**/*.ts', 'app/**/*.vue'],
      exclude: [
        'app/**/*.d.ts',
        'app/**/*.spec.ts',
        'app/**/*.test.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '~': fileURLToPath(new URL('./app', import.meta.url)),
      '@': fileURLToPath(new URL('./app', import.meta.url))
    }
  }
})

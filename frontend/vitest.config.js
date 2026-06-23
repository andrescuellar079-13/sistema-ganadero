import { defineConfig } from 'vitest/config'

// Configuración mínima para tests unitarios (sin DOM). Aislada del build de Vite.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
})

/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.VITE_CI,
  retries: process.env.VITE_CI ? 2 : 0,
  workers: process.env.VITE_CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  // Configuração para rodar o servidor de desenvolvimento automaticamente
  webServer: {
    command: 'npm run dev', // Comando para subir o Vite (frontend)
    url: 'http://localhost:5173', // A mesma URL configurada no baseURL
    reuseExistingServer: !process.env.VITE_CI, // Importante para não ficar abrindo portas infinitas localmente
  },

  projects: [
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    // Breakpoint extremo 320px
    {
      name: 'Mobile XS',
      use: { 
        viewport: { width: 320, height: 480 },
        userAgent: 'Mobile XS Testing Browser',
      },
    },
    {
      name: 'Desktop Chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.MOCK_PORT ?? 3000);

export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL ?? `http://localhost:${PORT}`,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  },
  // Spins up the in-memory mock API before the tests and shuts it down after.
  // Point BASE_URL at staging to run the same suite against the real API.
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: 'npm run mock',
        url: `http://localhost:${PORT}/health`,
        reuseExistingServer: !process.env.CI,
        env: { MOCK_PORT: String(PORT) },
      },
});

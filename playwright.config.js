import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'app.spec.js', workers: 1, timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4173', screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: false,
    env: { VITE_DATA_MODE: 'firebase',
      VITE_FIREBASE_API_KEY: 'demo-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-france-distribution.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'demo-france-distribution', VITE_FIREBASE_STORAGE_BUCKET: 'demo-france-distribution.firebasestorage.app',
      VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789', VITE_FIREBASE_APP_ID: '1:123456789:web:demo', VITE_USE_FIREBASE_EMULATORS: 'true',
    },
  },
});

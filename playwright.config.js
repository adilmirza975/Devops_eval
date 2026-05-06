// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    timeout: 30_000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:4173',
        headless: true,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    // Serve the backend and the built frontend before running tests
    webServer: [
        {
            command: 'npm start --prefix server',
            port: 5001,
            reuseExistingServer: true,
        },
        {
            command: 'npm run preview --prefix client',
            port: 4173,
            reuseExistingServer: true,
            timeout: 120_000,
        },
    ],
});



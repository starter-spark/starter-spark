import { defineConfig, devices } from '@playwright/test'

import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({
  path: path.resolve(__dirname, '.env'),
  quiet: true,
})

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const playwrightPort = Number(process.env.PLAYWRIGHT_PORT || 3000)

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://localhost:${playwrightPort}`,

    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Google Chrome',
      use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],

  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: `npm run start -- -H 127.0.0.1 -p ${playwrightPort}`,
        url: `http://localhost:${playwrightPort}`,
        reuseExistingServer:
          process.env.PLAYWRIGHT_REUSE_SERVER === '1' && !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})

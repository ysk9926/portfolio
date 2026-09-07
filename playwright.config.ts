import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90000,
  use: { baseURL: "http://127.0.0.1:3210", trace: "retain-on-failure" },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: "analytics.spec.ts",
    },
    {
      name: "webkit",
      use: { ...devices["iPhone 13"] },
      testMatch: "analytics.spec.ts",
    },
    {
      name: "admin-ui",
      use: { ...devices["Desktop Chrome"], baseURL: "http://127.0.0.1:3211" },
      testMatch: "analytics-admin.spec.ts",
    },
  ],
  webServer: [
    {
      command: "npm run dev -- --webpack --hostname 127.0.0.1 --port 3210",
      url: "http://127.0.0.1:3210",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
      env: {
        ANALYTICS_ENABLED: "true",
        ANALYTICS_QA_MODE: "true",
        ANALYTICS_SIGNING_SECRET: "local-test-signing-secret-at-least-32-bytes",
        ANALYTICS_RATE_LIMIT_SECRET: "local-test-rate-secret-at-least-32-bytes",
        SUPABASE_DB_URL:
          process.env.ANALYTICS_TEST_DB_URL ??
          "postgres://seung-gyu@127.0.0.1:54329/portfolio_analytics_test",
        SITE_URL: "http://127.0.0.1:3210",
      },
    },
    {
      command:
        "npx next dev tests/fixtures/analytics-admin --webpack --hostname 127.0.0.1 --port 3211",
      url: "http://127.0.0.1:3211",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});

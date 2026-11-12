import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8080",
    browserName: "chromium",
    headless: true,
    launchOptions: process.env.ADIGUNSP_CHROME_PATH
      ? { executablePath: process.env.ADIGUNSP_CHROME_PATH }
      : {}
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:8080/",
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});

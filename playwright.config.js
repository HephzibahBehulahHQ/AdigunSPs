import { defineConfig } from "@playwright/test";

const port = Number(process.env.ADIGUN_DEV_PORT || 8080);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    launchOptions: process.env.ADIGUNSP_CHROME_PATH
      ? { executablePath: process.env.ADIGUNSP_CHROME_PATH }
      : {}
  },
  webServer: {
    command: "npm run dev",
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000
  }
});

import { defineConfig } from "@playwright/test";

const productionBaseURL = process.env.ADIGUNSP_BASE_URL?.replace(/\/+$/, "");
const port = Number(process.env.ADIGUN_DEV_PORT || 8080);
const baseURL = productionBaseURL || `http://127.0.0.1:${port}`;
const browserName = process.env.ADIGUNSP_TEST_BROWSER || "chromium";
if (!["chromium", "firefox", "webkit"].includes(browserName)) {
  throw new Error(`Unsupported Playwright browser: ${browserName}`);
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: {
    baseURL,
    browserName,
    headless: true,
    launchOptions: browserName === "chromium" && process.env.ADIGUNSP_CHROME_PATH
      ? { executablePath: process.env.ADIGUNSP_CHROME_PATH }
      : {}
  },
  ...(!productionBaseURL && {
    webServer: {
      command: "npm run dev",
      url: `${baseURL}/`,
      reuseExistingServer: !process.env.CI,
      timeout: 30000
    }
  })
});

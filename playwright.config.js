// Tests de bout en bout : la page index.html est ouverte directement (file://), sans serveur.
// Installation : npm install && npx playwright install chromium   puis   npm test
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    // CHROMIUM_PATH : pour utiliser un Chromium déjà installé au lieu de celui de Playwright
    launchOptions: process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
    acceptDownloads: true,
    locale: "fr-BE",
  },
  projects: [
    { name: "ordinateur", use: { ...devices["Desktop Chrome"], viewport: { width: 1200, height: 900 } } },
    { name: "telephone", use: { ...devices["Pixel 7"] } },
  ],
});

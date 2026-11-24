import { readFile } from "node:fs/promises";

const baseUrl = process.argv[2] || process.env.ADIGUNSP_BASE_URL;
if (!baseUrl) throw new Error("Provide the deployed AdigunSPs base URL.");
const inventoryUrl = new URL("docs/component-bank/", baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`);

await Promise.all(["inventory.csv", "inventory.json"].map(async (file) => {
  const url = new URL(file, inventoryUrl);
  if (process.env.EXPECTED_RELEASE_SHA) url.searchParams.set("release", process.env.EXPECTED_RELEASE_SHA);
  const [response, source] = await Promise.all([
    fetch(url, { signal:AbortSignal.timeout(20000), cache:"no-store" }),
    readFile(new URL(`../docs/component-bank/${file}`, import.meta.url)),
  ]);
  if (!response.ok) throw new Error(`${file} returned HTTP ${response.status}.`);
  const deployed = Buffer.from(await response.arrayBuffer());
  if (!deployed.equals(source)) throw new Error(`${file} differs from the inventory in the release checkout.`);
  console.log(`${file} matches the release checkout (${deployed.length} bytes).`);
}));

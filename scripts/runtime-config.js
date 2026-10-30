import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const ADIGUN_SUPABASE_PROJECT_REF = "fqcbfnktdvqojyezxeis";
export const ADIGUN_SUPABASE_URL = `https://${ADIGUN_SUPABASE_PROJECT_REF}.supabase.co`;

async function readLocalEnvironment(root) {
  let source;
  try {
    source = await readFile(join(root, ".env"), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }

  const values = {};
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || match[1].startsWith("#")) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    values[match[1]] = value;
  }
  return values;
}

export async function loadAdigunRuntimeConfig(root) {
  const local = await readLocalEnvironment(root);
  return {
    supabase: {
      projectRef: ADIGUN_SUPABASE_PROJECT_REF,
      url: process.env.ADIGUN_SUPABASE_URL || local.ADIGUN_SUPABASE_URL || ADIGUN_SUPABASE_URL,
      publishableKey: process.env.ADIGUN_SUPABASE_PUBLISHABLE_KEY || local.ADIGUN_SUPABASE_PUBLISHABLE_KEY || "",
    },
  };
}

export function serializeAdigunRuntimeConfig(config) {
  return `globalThis.ADIGUN_RUNTIME_CONFIG = Object.freeze(${JSON.stringify(config)});\n`;
}

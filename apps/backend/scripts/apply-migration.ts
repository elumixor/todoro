import { readFileSync } from "node:fs";
import { createClient } from "@libsql/client";

const file = process.argv[2];
if (!file) throw new Error("usage: bun scripts/apply-migration.ts <migration.sql>");

const client = createClient({
  url: process.env.TURSO_DATABASE_URL as string,
  authToken: process.env.TURSO_AUTH_TOKEN as string,
});

const sql = readFileSync(file, "utf8");
await client.executeMultiple(sql);
console.log(`Applied ${file}`);

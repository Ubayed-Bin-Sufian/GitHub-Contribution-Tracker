import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(url, { max: 1 });
const file = join(dirname(fileURLToPath(import.meta.url)), "..", "drizzle", "0000_init.sql");
await sql.unsafe(readFileSync(file, "utf8"));
await sql.end();
console.log("Applied drizzle/0000_init.sql");

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL ?? "postgres://tracker:tracker@127.0.0.1:5432/tracker";

const globalForDb = globalThis as unknown as {
  postgres?: ReturnType<typeof postgres>;
};

export const client =
  globalForDb.postgres ??
  postgres(url, {
    max: 1,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.postgres = client;
}

export const db = drizzle(client, { schema });

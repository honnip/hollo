import type { Config } from "drizzle-kit";
import pgConnectionString from "pg-connection-string";

// biome-ignore lint/complexity/useLiteralKeys: tsc rants about this (TS4111)
const databaseUrl = process.env["DATABASE_URL"];
if (databaseUrl == null) throw new Error("DATABASE_URL must be defined");
const connectionOptions = pgConnectionString.parse(databaseUrl);

export default {
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: connectionOptions.host ?? "localhost",
    port: connectionOptions.port ? parseInt(connectionOptions.port) : undefined,
    user: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database ?? "hollo",
  },
} satisfies Config;

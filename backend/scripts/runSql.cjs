#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const resolveSqlFile = () => {
  const fileArg = process.argv[2] || "database/schema.sql";
  const absolutePath = path.resolve(process.cwd(), fileArg);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`SQL file not found: ${absolutePath}`);
  }
  return absolutePath;
};

const buildConnectionConfig = () => {
  const connectionString = process.env.DATABASE_URL;
  if (connectionString) {
    return {
      connectionString,
      ssl: { rejectUnauthorized: false },
    };
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || "https://qxeqahkekcdtqwckzavv.supabase.co";
  const projectHost = (() => {
    try {
      const { host } = new URL(supabaseUrl);
      return `db.${host}`;
    } catch (error) {
      throw new Error(`Invalid SUPABASE_URL: ${supabaseUrl}`);
    }
  })();

  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) {
    throw new Error("SUPABASE_DB_PASSWORD is required to run SQL scripts");
  }

  return {
    host: process.env.SUPABASE_DB_HOST || projectHost,
    port: Number(process.env.SUPABASE_DB_PORT || 5432),
    database: process.env.SUPABASE_DB_NAME || "postgres",
    user: process.env.SUPABASE_DB_USER || "postgres",
    password,
    ssl: { rejectUnauthorized: false },
  };
};

(async () => {
  const sqlPath = resolveSqlFile();
  const sql = fs.readFileSync(sqlPath, "utf8");
  if (!sql.trim()) {
    throw new Error(`SQL file is empty: ${sqlPath}`);
  }

  const client = new Client(buildConnectionConfig());

  try {
    console.log(`Applying SQL from ${sqlPath}...`);
    await client.connect();
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ SQL script applied successfully");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("❌ Failed to apply SQL script");
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
})();

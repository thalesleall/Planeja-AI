const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const migrations = [
  "database/migrations/2025-10-30_mvp_chat.sql",
  "database/migrations/2025-11-12_add_refresh_tokens.sql",
  "database/migrations/2025-11-12_add_refresh_tokens_metadata.sql",
];

function getProjectRef(url) {
  if (!url) {
    throw new Error("SUPABASE_URL não está configurada no .env");
  }
  try {
    const { hostname } = new URL(url.replace(/"/g, ""));
    return hostname.split(".")[0];
  } catch (err) {
    throw new Error(
      `Não foi possível extrair o project ref da URL do Supabase: ${err.message}`
    );
  }
}

async function run() {
  const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/"/g, "");
  const supabaseDbPassword = (process.env.SUPABASE_DB_PASSWORD || "").replace(
    /"/g,
    ""
  );

  if (!supabaseDbPassword) {
    throw new Error("SUPABASE_DB_PASSWORD não está configurada");
  }

  const projectRef = getProjectRef(supabaseUrl);
  const host = `db.${projectRef}.supabase.co`;

  const client = new Client({
    host,
    port: 5432,
    user: "postgres",
    password: supabaseDbPassword,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });

  console.log(`Conectando ao banco do Supabase em ${host}...`);
  await client.connect();

  try {
    for (const migrationPath of migrations) {
      const absolutePath = path.resolve(__dirname, "..", migrationPath);
      console.log(`\n➡️  Executando migração: ${migrationPath}`);
      const sql = fs.readFileSync(absolutePath, "utf8");
      await client.query(sql);
      console.log(`✅  Migração concluída: ${migrationPath}`);
    }
    console.log("\n🎉 Todas as migrações foram aplicadas com sucesso.");
  } finally {
    await client.end();
    console.log("Conexão com o banco encerrada.");
  }
}

run().catch((err) => {
  console.error("\n❌ Erro ao executar migrações:", err.message);
  process.exit(1);
});

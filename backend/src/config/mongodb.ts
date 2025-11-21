import fs from "fs";
import path from "path";
import { MongoClient, Db, MongoClientOptions, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";
const DB_NAME = process.env.MONGODB_DB_NAME || "planeja_ai";
const FORCE_TLS = process.env.MONGODB_TLS === "true";
const ALLOW_INVALID = process.env.MONGODB_ALLOW_INVALID_CERTS === "true";
const CA_FILE = process.env.MONGODB_CA_FILE?.trim();

let client: MongoClient | null = null;
let db: Db | null = null;

const buildMongoOptions = (): MongoClientOptions => {
  const options: MongoClientOptions = {
    serverApi: ServerApiVersion.v1,
  };

  const isSrv = MONGODB_URI.startsWith("mongodb+srv://");
  const shouldUseTls = FORCE_TLS || isSrv;

  if (shouldUseTls) {
    options.tls = true;
    options.retryReads = true;
    options.retryWrites = true;
    if (ALLOW_INVALID) {
      options.tlsAllowInvalidCertificates = true;
    }
    if (CA_FILE) {
      const resolved = path.resolve(CA_FILE);
      if (fs.existsSync(resolved)) {
        options.tlsCAFile = resolved;
      } else {
        console.warn(
          `⚠️ MONGODB_CA_FILE não encontrado em ${resolved}. Continuando sem arquivo CA.`
        );
      }
    }
  }

  return options;
};

export const connectMongoDB = async (): Promise<Db> => {
  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI não configurado. Defina-o para habilitar anexos."
    );
  }

  if (db) return db;

  try {
    client = new MongoClient(MONGODB_URI, buildMongoOptions());
    await client.connect();
    db = client.db(DB_NAME);

    const isCloud = MONGODB_URI.includes("mongodb+srv://");
    console.log(
      `✅ MongoDB conectado com sucesso (${isCloud ? "Atlas Cloud" : "Local"})`
    );
    console.log(`📦 Database: ${DB_NAME}`);

    // Criar índices para performance
    await db.collection("task_attachments").createIndex({ task_id: 1 });
    await db.collection("task_attachments").createIndex({ user_id: 1 });
    await db.collection("task_attachments").createIndex({ uploaded_at: -1 });

    console.log("📇 Índices criados: task_id, user_id, uploaded_at");

    return db;
  } catch (error) {
    console.error("⚠️ Erro ao conectar MongoDB:", error);
    console.log("💡 Continuando sem MongoDB. Anexos não estarão disponíveis.");
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error(
      "MongoDB não conectado. Execute connectMongoDB() primeiro."
    );
  }
  return db;
};

export const closeMongoDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log("MongoDB desconectado");
  }
};

// Verificar se MongoDB está disponível
export const isMongoDBConnected = (): boolean => {
  return db !== null;
};

import { MongoClient, Db } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGODB_DB_NAME || 'planeja_ai';

let client: MongoClient | null = null;
let db: Db | null = null;

export const connectMongoDB = async (): Promise<Db> => {
  if (db) return db;

  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    const isCloud = MONGODB_URI.includes('mongodb+srv://');
    console.log(`✅ MongoDB conectado com sucesso (${isCloud ? 'Atlas Cloud' : 'Local'})`);
    console.log(`📦 Database: ${DB_NAME}`);
    
    // Criar índices para performance
    await db.collection('task_attachments').createIndex({ task_id: 1 });
    await db.collection('task_attachments').createIndex({ user_id: 1 });
    await db.collection('task_attachments').createIndex({ uploaded_at: -1 });
    
    console.log('📇 Índices criados: task_id, user_id, uploaded_at');
    
    return db;
  } catch (error) {
    console.error('⚠️ Erro ao conectar MongoDB:', error);
    console.log('💡 Continuando sem MongoDB. Anexos não estarão disponíveis.');
    throw error;
  }
};

export const getDB = (): Db => {
  if (!db) {
    throw new Error('MongoDB não conectado. Execute connectMongoDB() primeiro.');
  }
  return db;
};

export const closeMongoDB = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB desconectado');
  }
};

// Verificar se MongoDB está disponível
export const isMongoDBConnected = (): boolean => {
  return db !== null;
};

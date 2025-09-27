import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

export const config = {
  server: {
    port: parseInt(process.env.PORT || "3001"),
    env: process.env.NODE_ENV || "development",
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"),
  },
  
  security: {
    sessionSecret: process.env.SESSION_SECRET || "change-this-in-production",
  },
  
  cors: {
    origins: process.env.NODE_ENV === "production" 
      ? [process.env.FRONTEND_URL || "http://localhost:3000"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
  },
  
  json: {
    limit: "10mb",
  },
  
  app: {
    name: "Planeja-AI Backend",
    version: "1.0.0",
  }
};

export default config;
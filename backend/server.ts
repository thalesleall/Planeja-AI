import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

// Importar rotas
import supabaseRoutes from "./src/routes/supabase";
import apiRoutes from "./src/routes/api";

// Importar MongoDB
import { connectMongoDB } from "./src/config/mongodb";
import { initAttachmentModel } from "./src/controllers/attachmentController";

// Carregar variáveis de ambiente
dotenv.config();

// Configurações do servidor
const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || "development";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Configuração de rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // máximo de 100 requests por IP
  message: {
    error: "Muitas requisições realizadas. Tente novamente em alguns minutos.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware de segurança
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // Necessário para desenvolvimento
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// Configuração de CORS
app.use(
  cors({
    origin:
      NODE_ENV === "production"
        ? [FRONTEND_URL]
        : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Middleware de compressão
app.use(compression());

// Rate limiting
app.use(limiter);

// Middleware para parsear JSON com limite de tamanho
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// parse HttpOnly cookies for refresh token handling
app.use(cookieParser());

// Middleware de logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress || "Unknown";

  console.log(
    `[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - User-Agent: ${userAgent}`
  );
  next();
});

// Middleware de saúde da aplicação
app.use("/health", (req: Request, res: Response, next: NextFunction) => {
  res.locals.startTime = Date.now();
  next();
});

// =============================================
// ROTAS DA API
// =============================================

// Rota de health check
app.get("/health", (req: Request, res: Response) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: "1.0.0",
    memory: {
      used:
        Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
      total:
        Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100,
    },
    responseTime: `${Date.now() - res.locals.startTime}ms`,
  };

  res.status(200).json(healthCheck);
});

// Rota principal
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "🚀 Planeja-AI Backend Server",
    version: "1.0.0",
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      ping: "/ping",
      api: "/api/v1",
    },
  });
});

// Rota de ping
app.get("/ping", (req: Request, res: Response) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    server: "Planeja-AI Backend",
  });
});

// Rota base da API v1
app.get("/api/v1", (req: Request, res: Response) => {
  res.json({
    message: "Planeja-AI API v1",
    version: "1.0.0",
    documentation: "/api/v1/docs",
    endpoints: {
      // Autenticação
      register: "POST /api/v1/auth/register",
      login: "POST /api/v1/auth/login",
      profile: "GET /api/v1/auth/me",

      // Tarefas
      tasks: "GET /api/v1/tasks",
      pendingTasks: "GET /api/v1/tasks/pending",
      completedTasks: "GET /api/v1/tasks/completed",
      createTask: "POST /api/v1/tasks",
      completeTask: "PUT /api/v1/tasks/:id/complete",
      deleteTask: "DELETE /api/v1/tasks/:id",

      // Utilitários
      supabase: "/api/v1/supabase",
    },
  });
});

// Rotas da API v1
app.use("/api/v1", apiRoutes);

// Rotas do Supabase
app.use("/api/v1", supabaseRoutes);

// =============================================
// MIDDLEWARE DE TRATAMENTO DE ERROS
// =============================================

// Handler para rotas não encontradas
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint não encontrado",
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString(),
    availableEndpoints: ["/", "/health", "/ping", "/api/v1"],
  });
});

// Middleware global de tratamento de erros
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const errorId = Date.now().toString(36);

  // Log detalhado do erro
  console.error(`[${timestamp}] ERROR ${errorId}:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Resposta baseada no ambiente
  const errorResponse = {
    error: "Erro interno do servidor",
    message: NODE_ENV === "development" ? err.message : "Algo deu errado!",
    errorId,
    timestamp,
    ...(NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(err.status || 500).json(errorResponse);
});

// =============================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================
import https from "https";
import fs from "fs";
import { initRealtime } from "./src/lib/realtime";
import { startRefreshTokenCleanup } from "./src/jobs/refreshTokenCleanup";

const certPath = "/etc/nginx/certs/fullchain.pem";
const keyPath = "/etc/nginx/certs/privkey.pem";
const isTestEnv = NODE_ENV === "test";
let server: any;

if (!isTestEnv) {
  if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    const options = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };
    server = https.createServer(options, app).listen(PORT, () => {
      console.log(`
🚀 Planeja-AI Backend Server iniciado com sucesso!
📍 URL: https://localhost:${PORT}
🌍 Ambiente: ${NODE_ENV}
📊 Health Check: https://localhost:${PORT}/health
🔄 API v1: https://localhost:${PORT}/api/v1
⏰ Iniciado em: ${new Date().toISOString()}
      `);
    });
  } else {
    server = app.listen(PORT, () => {
      console.log(`
🚀 Planeja-AI Backend Server iniciado com sucesso!
📍 URL: http://localhost:${PORT}
🌍 Ambiente: ${NODE_ENV}
📊 Health Check: http://localhost:${PORT}/health
🔄 API v1: http://localhost:${PORT}/api/v1
⏰ Iniciado em: ${new Date().toISOString()}
      `);
    });
  }

  // Initialize realtime after server is created
  initRealtime(server as any).catch((err) => {
    console.error("Failed to initialize realtime:", err);
  });

  // Initialize MongoDB for attachments
  connectMongoDB()
    .then(() => {
      initAttachmentModel();
      console.log("✅ MongoDB attachment system ready");
    })
    .catch((err) => {
      console.warn("⚠️ MongoDB not available. Attachments will be disabled.");
      console.warn(
        "💡 To enable attachments, install MongoDB: docker run -d -p 27017:27017 mongo"
      );
    });

  // Start in-process refresh-token cleanup job (removes expired refresh tokens)
  // Returns a stop function if needed.
  try {
    startRefreshTokenCleanup();
  } catch (e) {
    console.error("Failed to start refresh token cleanup job", e);
  }

  // Graceful shutdown
  process.on("SIGTERM", () => {
    console.log("🛑 SIGTERM recebido. Encerrando servidor graciosamente...");
    server.close(() => {
      console.log("✅ Servidor encerrado com sucesso.");
      process.exit(0);
    });
  });

  process.on("SIGINT", () => {
    console.log("🛑 SIGINT recebido. Encerrando servidor graciosamente...");
    server.close(() => {
      console.log("✅ Servidor encerrado com sucesso.");
      process.exit(0);
    });
  });

  // Tratamento de erros não capturados
  process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason, promise) => {
    console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(1);
  });
}

export default app;

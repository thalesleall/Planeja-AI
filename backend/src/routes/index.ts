import { Request, Response, Router } from "express";
import config from "../config";
import attachmentRoutes from "./attachments";

const router = Router();

// Rota de health check
router.get("/health", (req: Request, res: Response) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.server.env,
    version: config.app.version,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
    },
    responseTime: res.locals.startTime ? `${Date.now() - res.locals.startTime}ms` : "N/A"
  };
  
  res.status(200).json(healthCheck);
});

// Rotas de anexos
router.use("/", attachmentRoutes);

// Rota principal
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: `🚀 ${config.app.name}`,
    version: config.app.version,
    environment: config.server.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      ping: "/ping",
      api: "/api/v1"
    }
  });
});

// Rota de ping
router.get("/ping", (req: Request, res: Response) => {
  res.json({ 
    message: "pong",
    timestamp: new Date().toISOString(),
    server: config.app.name
  });
});

export default router;
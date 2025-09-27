import { Request, Response, NextFunction } from "express";
import config from "../config";

export const logger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const userAgent = req.get("User-Agent") || "Unknown";
  const ip = req.ip || req.connection.remoteAddress || "Unknown";
  
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${ip} - User-Agent: ${userAgent}`);
  next();
};

export const healthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.path === "/health") {
    res.locals.startTime = Date.now();
  }
  next();
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: "Endpoint não encontrado",
    message: `A rota ${req.method} ${req.originalUrl} não existe`,
    timestamp: new Date().toISOString(),
    availableEndpoints: ["/", "/health", "/ping", "/api/v1"]
  });
};

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  const errorId = Date.now().toString(36);
  
  // Log detalhado do erro
  console.error(`[${timestamp}] ERROR ${errorId}:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get("User-Agent")
  });

  // Resposta baseada no ambiente
  const errorResponse = {
    error: "Erro interno do servidor",
    message: config.server.env === "development" ? err.message : "Algo deu errado!",
    errorId,
    timestamp,
    ...(config.server.env === "development" && { stack: err.stack })
  };

  res.status(err.status || 500).json(errorResponse);
};
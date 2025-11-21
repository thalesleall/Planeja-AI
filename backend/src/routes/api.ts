import { Request, Response, Router } from "express";
import config from "../config";
import authRoutes from "./auth";
import taskRoutes from "./tasks";
import listRoutes from "./lists";
import supabaseRoutes from "./supabase";
import chatRoutes from "./chats";
import aiRoutes from "./ai";
import attachmentRoutes from "./attachments";

const router = Router();

// Rota base da API v1
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Planeja-AI API v1",
    version: config.app.version,
    documentation: "/api/v1/docs",
    endpoints: {
      // Autenticação
      register: "POST /api/v1/auth/register",
      login: "POST /api/v1/auth/login",
      profile: "GET /api/v1/auth/me",

      // Listas
      lists: "GET /api/v1/lists",
      listDetails: "GET /api/v1/lists/:id",
      createList: "POST /api/v1/lists",
      deleteList: "DELETE /api/v1/lists/:id",

      // Tarefas/Itens
      tasks: "GET /api/v1/tasks",
      pendingTasks: "GET /api/v1/tasks/pending",
      completedTasks: "GET /api/v1/tasks/completed",
      createTask: "POST /api/v1/lists/:listId/items",
      completeTask: "PUT /api/v1/tasks/:id/complete",
      deleteTask: "DELETE /api/v1/tasks/:id",
      aiSuggestFromTitle: "POST /api/v1/ai/tasks/suggest-title",

      // Utilitários
      supabase: "/api/v1/supabase",
    },
  });
});

// Rotas de autenticação
router.use("/auth", authRoutes);

// Rotas de listas
router.use("/lists", listRoutes);

// Rotas de tarefas
router.use("/tasks", taskRoutes);

// Rotas de chats (AI)
router.use("/chats", chatRoutes);

// Rotas de IA auxiliares
router.use("/ai", aiRoutes);

// Rotas de anexos
router.use("/", attachmentRoutes);

// Rotas de utilitários
router.use("/supabase", supabaseRoutes);

export default router;

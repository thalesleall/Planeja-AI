import { Request, Response, Router } from "express";
import config from "../config";

const router = Router();

// Rota base da API v1
router.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Planeja-AI API v1",
    version: config.app.version,
    documentation: "/api/v1/docs",
    endpoints: {
      // Aqui você pode listar os endpoints disponíveis
      users: "/api/v1/users",
      plans: "/api/v1/plans", 
      tasks: "/api/v1/tasks"
    }
  });
});

// Placeholder para futuras rotas
router.get("/users", (req: Request, res: Response) => {
  res.json({
    message: "Endpoint de usuários - Em desenvolvimento",
    available: false
  });
});

router.get("/plans", (req: Request, res: Response) => {
  res.json({
    message: "Endpoint de planos - Em desenvolvimento", 
    available: false
  });
});

router.get("/tasks", (req: Request, res: Response) => {
  res.json({
    message: "Endpoint de tarefas - Em desenvolvimento",
    available: false
  });
});

export default router;
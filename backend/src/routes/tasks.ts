import { Router } from "express";
import { TaskController } from "../controllers/taskController";
import {
  validateCreateTask,
  validateUpdateTask,
} from "../middleware/validation";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Aplicar autenticação a todas as rotas de tarefas
router.use(authenticateToken);

// GET /tasks - Obter todas as tarefas (com filtros opcionais)
router.get("/", TaskController.getTasks);

// GET /tasks/pending - Obter tarefas pendentes
router.get("/pending", TaskController.getPendingTasks);

// GET /tasks/completed - Obter tarefas concluídas
router.get("/completed", TaskController.getCompletedTasks);

// POST /tasks - Criar nova tarefa
router.post("/", validateCreateTask, TaskController.createTask);

// PUT /tasks/:id - Atualizar campos da tarefa
router.put("/:id", validateUpdateTask, TaskController.updateTask);

// PUT /tasks/:id/complete - Marcar tarefa como concluída
router.put("/:id/complete", TaskController.completeTask);

// DELETE /tasks/:id - Deletar tarefa
router.delete("/:id", TaskController.deleteTask);

export default router;

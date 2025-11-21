import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import AiController from "../controllers/aiController";

const router = Router();

router.use(authenticateToken);
router.post("/tasks/suggest-title", AiController.suggestTasksFromTitle);

export default router;

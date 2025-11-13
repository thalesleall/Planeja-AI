import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import ChatController from "../controllers/chatController";
import { validatePrompt } from "../middleware/validation";

const router = Router();

// All chat endpoints require authenticated user
router.use(authenticateToken);

// List chats for the current user
router.get("/", ChatController.listChats);

// Get messages for a specific chat
router.get("/:id/messages", ChatController.getMessages);

// Post a message to a chat (or create a new chat if none provided)
router.post("/messages", validatePrompt, ChatController.postMessage);

export default router;

import { Request, Response } from "express";
import ChatService from "../services/chatService";

const listChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const chats = await ChatService.getChatsForUser(userId);
    res.json({ success: true, data: chats });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const chatId = req.params.id;
    const messages = await ChatService.getMessagesForChat(userId, chatId);
    res.json({ success: true, data: messages });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const postMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const { chat_id, message } = req.body;

    if (!message || typeof message !== "string") {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    const result = await ChatService.addMessageAndMaybeAct({
      userId,
      chatId: chat_id,
      message,
    });
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error("Error in postMessage:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const createChat = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id as string;
    const chat = await ChatService.createChatForUser(userId);
    res.status(201).json({ success: true, data: chat });
  } catch (err: any) {
    console.error("createChat error", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  listChats,
  getMessages,
  postMessage,
  createChat,
};

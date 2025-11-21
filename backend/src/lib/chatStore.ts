import crypto from "crypto";
import { supabase, supabaseAdmin } from "../config/supabase";

export type ChatRecord = {
  id: string;
  user_id: string;
  title: string | null;
  created_at: string;
};

export type ChatMessageRecord = {
  id: string;
  chat_id: string;
  role: string;
  content: string;
  user_id: string | null;
  created_at: string;
};

const memoryChats = new Map<string, ChatRecord>();
const memoryMessages = new Map<string, ChatMessageRecord[]>();
let useMemoryStore = false;
const isTestEnv = process.env.NODE_ENV === "test";
if (isTestEnv) {
  useMemoryStore = true;
}

const FALLBACK_MESSAGES = [
  "invalid api key",
  "permission denied",
  "schema cache",
  "could not find the table",
];

const shouldFallback = (error?: { message?: string }) => {
  if (!error || !error.message) return false;
  const message = error.message.toLowerCase();
  return FALLBACK_MESSAGES.some((needle) => message.includes(needle));
};

const markMemory = (reason?: string) => {
  if (!useMemoryStore) {
    useMemoryStore = true;
    console.warn(
      "⚠️  Falling back to in-memory chat store:",
      reason || "Unknown reason"
    );
  }
};

const memoryCreateChat = (userId: string): ChatRecord => {
  const chat: ChatRecord = {
    id: crypto.randomUUID(),
    user_id: userId,
    title: null,
    created_at: new Date().toISOString(),
  };
  memoryChats.set(chat.id, chat);
  memoryMessages.set(chat.id, []);
  return chat;
};

const memoryInsertMessage = (
  payload: Omit<ChatMessageRecord, "id" | "created_at">
) => {
  const message: ChatMessageRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload,
  };
  const list = memoryMessages.get(message.chat_id) || [];
  list.push(message);
  memoryMessages.set(message.chat_id, list);
  return message;
};

export const ChatStore = {
  usingMemory: () => useMemoryStore,

  async listChats(userId: string): Promise<ChatRecord[]> {
    if (useMemoryStore) {
      return Array.from(memoryChats.values()).filter(
        (chat) => chat.user_id === userId
      );
    }

    const { data, error } = await supabase
      .from("chats")
      .select("id, user_id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) return data as ChatRecord[];

    if (shouldFallback(error)) {
      markMemory(error?.message);
      return Array.from(memoryChats.values()).filter(
        (chat) => chat.user_id === userId
      );
    }

    throw new Error(error?.message || "Failed to list chats");
  },

  async listMessages(chatId: string): Promise<ChatMessageRecord[]> {
    if (useMemoryStore) {
      return memoryMessages.get(chatId)?.slice() || [];
    }

    const { data, error } = await supabase
      .from("chat_messages")
      .select("id, chat_id, role, content, user_id, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (!error && data) return data as ChatMessageRecord[];

    if (shouldFallback(error)) {
      markMemory(error?.message);
      return memoryMessages.get(chatId)?.slice() || [];
    }

    throw new Error(error?.message || "Failed to list chat messages");
  },

  async ensureChat(
    userId: string,
    chatId?: string | null
  ): Promise<ChatRecord> {
    if (chatId && useMemoryStore) {
      const chat = memoryChats.get(chatId);
      if (!chat) throw new Error("Chat não encontrado");
      return chat;
    }

    if (!chatId) {
      return this.createChat(userId);
    }

    const { data, error } = await supabase
      .from("chats")
      .select("id, user_id, title, created_at")
      .eq("id", chatId)
      .eq("user_id", userId)
      .single();

    if (!error && data) return data as ChatRecord;

    if (shouldFallback(error)) {
      markMemory(error?.message);
      const chat = memoryChats.get(chatId);
      if (!chat) throw new Error("Chat não encontrado (fallback)");
      return chat;
    }

    throw new Error(error?.message || "Chat não encontrado");
  },

  async createChat(userId: string): Promise<ChatRecord> {
    if (useMemoryStore) {
      return memoryCreateChat(userId);
    }

    const { data, error } = await (supabaseAdmin || supabase)
      .from("chats")
      .insert([{ user_id: userId, title: null }])
      .select("id, user_id, title, created_at")
      .single();

    if (!error && data) return data as ChatRecord;

    if (shouldFallback(error)) {
      markMemory(error?.message);
      return memoryCreateChat(userId);
    }

    throw new Error(error?.message || "Failed to create chat");
  },

  async insertMessage(payload: {
    chat_id: string;
    role: string;
    content: string;
    user_id: string | null;
  }): Promise<ChatMessageRecord> {
    if (useMemoryStore) {
      return memoryInsertMessage(payload);
    }

    const { data, error } = await (supabaseAdmin || supabase)
      .from("chat_messages")
      .insert([payload])
      .select("id, chat_id, role, content, user_id, created_at")
      .single();

    if (!error && data) return data as ChatMessageRecord;

    if (shouldFallback(error)) {
      markMemory(error?.message);
      return memoryInsertMessage(payload);
    }

    throw new Error(error?.message || "Failed to insert message");
  },
};

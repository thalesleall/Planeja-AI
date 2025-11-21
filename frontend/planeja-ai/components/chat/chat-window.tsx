"use client";

import * as React from "react";
import type { Socket } from "socket.io-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type ChatMessage = { id?: string; role: string; content: string };

type RawChatMessage = {
  id?: string;
  uuid?: string;
  role?: string;
  sender?: string;
  user_id?: string | number | null;
  content?: string;
  text?: string;
  message?: string;
};

type ChatMessagesResponse = {
  data?: RawChatMessage[];
  items?: RawChatMessage[];
};

type ChatStreamPayload = {
  chatId?: string | number;
  token?: string;
  text?: string;
};

type SendMessageResponse = {
  data?: { chat_id?: string | number };
  chat_id?: string | number;
};

const extractRawMessages = (payload: unknown): RawChatMessage[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as RawChatMessage[];
  if (typeof payload === "object") {
    const typed = payload as ChatMessagesResponse & { data?: unknown };
    const dataField = typed.data;
    if (Array.isArray(dataField)) return dataField;
    if (dataField && typeof dataField === "object") {
      const nestedItems = (dataField as ChatMessagesResponse).items;
      if (Array.isArray(nestedItems)) return nestedItems;
    }
    const itemsField = typed.items;
    if (Array.isArray(itemsField)) return itemsField;
  }
  return [];
};

const normalizeMessage = (
  raw: RawChatMessage,
  currentUserId?: string | null
): ChatMessage => {
  const id =
    typeof raw.id === "string"
      ? raw.id
      : typeof raw.uuid === "string"
      ? raw.uuid
      : undefined;
  const fallbackRole =
    raw.user_id && currentUserId && String(raw.user_id) === currentUserId
      ? "user"
      : "assistant";
  const role = raw.role ?? raw.sender ?? fallbackRole;
  const content =
    raw.content ??
    raw.text ??
    (raw.message !== undefined ? String(raw.message) : "");
  return { id, role, content };
};

const extractChatId = (payload: unknown): string | number | null => {
  if (!payload || typeof payload !== "object") return null;
  const typed = payload as SendMessageResponse;
  return typed.data?.chat_id ?? typed.chat_id ?? null;
};

export default function ChatWindow({
  className,
  title,
  chatId,
  userId,
  onChatCreated,
}: {
  className?: string;
  title?: string;
  chatId?: string | null;
  userId?: string | null;
  onChatCreated?: (chatId: string) => void;
}) {
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = React.useState("");

  React.useEffect(() => {
    if (!chatId) {
      setMessages([]);
      setStreaming("");
      return;
    }
    let mounted = true;
    import("@/lib/api")
      .then(async ({ default: api }) => {
        try {
          const res = await api.chats.getMessages(chatId);
          if (!mounted) return;
          if (!res.ok) {
            console.error("failed to load messages", res.status, res.data);
            toast.error("Falha ao carregar as mensagens do chat.");
            return;
          }
          const normalized = extractRawMessages(res.data).map((raw) =>
            normalizeMessage(raw, userId)
          );
          setMessages(normalized);
        } catch (err) {
          console.error("failed to load messages", err);
          toast.error("Erro ao buscar mensagens do chat.");
        }
      })
      .catch((err) => console.error("failed to import api", err));

    return () => {
      mounted = false;
    };
  }, [chatId, userId]);

  // socket streaming
  React.useEffect(() => {
    let activeSocket: Socket | null = null;
    async function setup() {
      const { initSocket } = await import("@/lib/socket");
      try {
        activeSocket = initSocket();
      } catch (err) {
        console.warn("Socket init error", err);
        toast.error("Não foi possível conectar ao chat em tempo real.");
        return;
      }
      activeSocket.on("chat:stream:token", (payload: ChatStreamPayload) => {
        // payload { chatId, userId, token }
        if (!payload) return;
        if (!chatId) return;
        if (String(payload.chatId) !== String(chatId)) return;
        setStreaming((s) => s + String(payload.token ?? ""));
      });

      activeSocket.on("chat:stream:done", (payload: ChatStreamPayload) => {
        if (!chatId) return;
        if (String(payload?.chatId) !== String(chatId)) return;
        setStreaming((current) => {
          const finalText = payload?.text ?? current;
          setMessages((m) => [...m, { role: "assistant", content: finalText }]);
          return "";
        });
      });
    }

    setup().catch((e) => console.warn(e));

    return () => {
      try {
        if (activeSocket) {
          activeSocket.off("chat:stream:token");
          activeSocket.off("chat:stream:done");
        }
      } catch {}
    };
  }, [chatId]);

  function sendMessage() {
    if (!message || !chatId) return;
    // optimistic append
    setMessages((m) => [...m, { role: "user", content: message }]);
    setMessage("");

    import("@/lib/api")
      .then(async ({ default: api }) => {
        try {
          const response = await api.chats.postMessage({
            chat_id: chatId,
            message,
          });
          const serverChatId = extractChatId(response.data);
          if (serverChatId && String(serverChatId) !== String(chatId)) {
            onChatCreated?.(String(serverChatId));
          }
          // server will stream tokens via socket; final persisted assistant message will be appended on stream:done
        } catch (err) {
          console.error("send failed", err);
          toast.error("Não conseguimos enviar sua mensagem.");
        }
      })
      .catch((err) => console.error("send failed", err));
  }

  return (
    <main className={cn("flex-1 h-full min-h-[60vh]", className)}>
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>{title || (chatId ? "Chat" : "Select a chat")}</CardTitle>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-6 py-4 bg-background">
          <div className="flex flex-col gap-4">
            {messages.map((m, idx) => (
              <div
                key={m.id ?? idx}
                className={
                  m.role === "user"
                    ? "self-end bg-primary/10 rounded-md px-3 py-2 max-w-[80%]"
                    : "self-start bg-accent/10 rounded-md px-3 py-2 max-w-[80%]"
                }
              >
                {m.content}
              </div>
            ))}

            {streaming && (
              <div className="self-start bg-accent/10 rounded-md px-3 py-2 max-w-[80%]">
                {streaming}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setMessage(e.target.value)
              }
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

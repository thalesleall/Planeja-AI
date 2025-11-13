"use client"

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export default function ChatWindow({
  className,
  title,
  chatId,
  userId,
}: {
  className?: string;
  title?: string;
  chatId?: string | null;
  userId?: string | null;
}) {
  const [message, setMessage] = React.useState("");
  const [messages, setMessages] = React.useState<Array<{ id?: string; role: string; content: string }>>([]);
  const [streaming, setStreaming] = React.useState("");

  React.useEffect(() => {
    if (!chatId) return;
    let mounted = true;
    fetch(`/api/v1/chats/${chatId}/messages`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        const list = data?.data ?? data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((m: any) => ({
          id: m.id ?? m.uuid,
          role: m.role ?? m.sender ?? (m.user_id ? "user" : "assistant"),
          content: m.content ?? m.text ?? String(m.message ?? ""),
        }));
        setMessages(normalized);
      })
      .catch((err) => console.error("failed to load messages", err));

    return () => {
      mounted = false;
    };
  }, [chatId]);

  // socket streaming
  React.useEffect(() => {
    let socket: any;
    let connected = false;
    async function setup() {
      const { initSocket, getSocket } = await import("@/lib/socket");
      socket = initSocket();
      socket.on("connect", () => {
        connected = true;
      });

      socket.on("chat:stream:token", (payload: any) => {
        // payload { chatId, userId, token }
        if (!payload) return;
        if (chatId && String(payload.chatId) !== String(chatId)) return;
        setStreaming((s) => s + String(payload.token ?? ""));
      });

      socket.on("chat:stream:done", (payload: any) => {
        if (chatId && String(payload.chatId) !== String(chatId)) return;
        const finalText = payload?.text ?? streaming;
        setMessages((m) => [...m, { role: "assistant", content: finalText }]);
        setStreaming("");
      });
    }

    setup().catch((e) => console.warn(e));

    return () => {
      try {
        if (socket) {
          socket.off("chat:stream:token");
          socket.off("chat:stream:done");
        }
      } catch (e) {}
    };
  }, [chatId]);

  function sendMessage() {
    if (!message || !chatId) return;
    const payload = { chat_id: chatId, content: message };
    // optimistic append
    setMessages((m) => [...m, { role: "user", content: message }]);
    setMessage("");

    fetch(`/api/v1/chats/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((r) => r.json())
      .then((data) => {
        // server will stream tokens via socket; final persisted assistant message will be appended on stream:done
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
                className={m.role === "user" ? "self-end bg-primary/10 rounded-md px-3 py-2 max-w-[80%]" : "self-start bg-accent/10 rounded-md px-3 py-2 max-w-[80%]"}
              >
                {m.content}
              </div>
            ))}

            {streaming && (
              <div className="self-start bg-accent/10 rounded-md px-3 py-2 max-w-[80%]">{streaming}</div>
            )}
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e: any) => setMessage(e.target.value)}
            />
            <Button onClick={sendMessage}>Send</Button>
          </div>
        </CardFooter>
      </Card>
    </main>
  );
}

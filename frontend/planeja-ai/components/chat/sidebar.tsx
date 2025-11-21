"use client";

import * as React from "react";
import api from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type ChatItem = {
  id: string;
  title: string;
  lastMessage?: string;
};

type ChatCreateResponse = {
  data?: Record<string, unknown>;
} & Record<string, unknown>;

export default function ChatSidebar({
  className,
  onSelect,
  onDataChange,
}: {
  className?: string;
  onSelect?: (id: string) => void;
  onDataChange?: (chats: ChatItem[]) => void;
}) {
  const [chats, setChats] = React.useState<ChatItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const data = await api.chats.list();
        if (!mounted) return;
        // Expecting { data: [] } or array
        const list: unknown = data?.data ?? data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((c) => {
          const item = c as Record<string, unknown>;
          const id = String(
            item["id"] ?? item["chat_id"] ?? item["uuid"] ?? ""
          );
          const titleRaw = item["title"] ?? item["name"] ?? undefined;
          const lastMessageRaw =
            item["last_message"] ?? item["lastMessage"] ?? undefined;
          const title = typeof titleRaw === "string" ? titleRaw : `Chat ${id}`;
          const lastMessage =
            typeof lastMessageRaw === "string" ? lastMessageRaw : undefined;
          return { id, title, lastMessage } as ChatItem;
        });
        setChats(normalized);
        onDataChange?.(normalized);
      } catch (err) {
        // keep console error for visibility
        console.error("Failed to load chats", err);
        toast.error("Não foi possível carregar os seus chats.");
      } finally {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [onDataChange]);

  const handleNewChat = async () => {
    try {
      setCreating(true);
      const response = await api.chats.create();
      if (!response.ok) throw new Error("Falha ao criar chat");
      const payload = response.data as ChatCreateResponse | null;
      const chatData = (payload?.data ?? payload) as Record<
        string,
        unknown
      > | null;
      const idRaw =
        chatData?.["id"] ?? chatData?.["chat_id"] ?? chatData?.["uuid"];
      if (typeof idRaw !== "undefined" && idRaw !== null) {
        const titleRaw = chatData?.["title"] ?? chatData?.["name"];
        const newChat: ChatItem = {
          id: String(idRaw),
          title: typeof titleRaw === "string" ? titleRaw : "Novo chat",
        };
        setChats((prev) => {
          const next = [newChat, ...prev];
          onDataChange?.(next);
          return next;
        });
        onSelect?.(String(idRaw));
      }
    } catch (err) {
      console.error("Erro ao criar chat", err);
      toast.error("Falha ao criar um novo chat.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside
      className={cn(
        "hidden lg:block w-80 min-w-[18rem] max-w-sm h-full",
        className
      )}
    >
      <Card className="h-full flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Chats</CardTitle>
            <Button size="sm" onClick={handleNewChat} disabled={creating}>
              {creating ? "Criando..." : "Novo"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-0">
          <div className="p-4">
            <Input placeholder="Search chats" />
          </div>

          <div className="divide-y">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground">
                Loading...
              </div>
            )}

            {!loading && chats.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">
                No chats yet. Create one using the &quot;New&quot; button.
              </div>
            )}

            {chats.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect?.(c.id)}
                className="w-full text-left p-4 hover:bg-accent/50"
              >
                <div className="font-medium">{c.title}</div>
                {c.lastMessage && (
                  <div className="text-muted-foreground text-sm truncate">
                    {c.lastMessage}
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>

        <CardFooter>
          <div className="w-full text-sm text-muted-foreground">
            Logged as You
          </div>
        </CardFooter>
      </Card>
    </aside>
  );
}

"use client"

import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

type ChatItem = {
  id: string;
  title: string;
  lastMessage?: string;
};

export default function ChatSidebar({
  className,
  onSelect,
}: {
  className?: string;
  onSelect?: (id: string) => void;
}) {
  const [chats, setChats] = React.useState<ChatItem[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`/api/v1/chats`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        // Expecting { data: [] } or array
        const list: any = data?.data ?? data ?? [];
        const normalized = (Array.isArray(list) ? list : []).map((c: any) => ({
          id: String(c.id ?? c.chat_id ?? c.uuid),
          title: c.title ?? c.name ?? `Chat ${c.id}`,
          lastMessage: c.last_message ?? c.lastMessage ?? undefined,
        }));
        setChats(normalized);
      })
      .catch((err) => console.error("Failed to load chats", err))
      .finally(() => setLoading(false));

    return () => {
      mounted = false;
    };
  }, []);

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
            <Button size="sm">New</Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto px-0">
          <div className="p-4">
            <Input placeholder="Search chats" />
          </div>

          <div className="divide-y">
            {loading && (
              <div className="p-6 text-sm text-muted-foreground">Loading...</div>
            )}

            {!loading && chats.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">
                No chats yet. Create one using the "New" button.
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
          <div className="w-full text-sm text-muted-foreground">Logged as You</div>
        </CardFooter>
      </Card>
    </aside>
  );
}

"use client"

import * as React from "react";
import ChatSidebar from "@/components/chat/sidebar";
import ChatWindow from "@/components/chat/chat-window";
import { initSocket } from "@/lib/socket";
import { getToken, refreshToken } from "@/lib/auth";

const mockChats = [
  { id: "1", title: "Project kickoff", lastMessage: "Let's start planning" },
  { id: "2", title: "Sprint planning", lastMessage: "Define sprint goals" },
];

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);

  React.useEffect(() => {
    // try to read user id and token from localStorage (adjust to your auth flow)
    const uid = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    setUserId(uid);

    // initialize socket when token is present
    (async () => {
      const token = await getToken();
      if (token) {
        // Ensure window.refreshAuthToken exists (from lib/auth)
        (window as any).getNewToken = async () => {
          const t = await refreshToken();
          return t;
        };

        initSocket({ token, autoConnect: true });
      }
    })();
  }, []);

  return (
    <div className="min-h-screen h-full p-4 lg:p-6">
      <div className="h-[80vh] rounded-lg border flex flex-col lg:flex-row gap-4">
        {/* Desktop sidebar */}
        <ChatSidebar onSelect={(id) => setSelectedChat(id)} />

        {/* Mobile-only list (full page on small screens) */}
        <div className="lg:hidden">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Chats</h2>
          </div>
          <div className="space-y-2">
            {mockChats.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChat(c.id)}
                className="w-full text-left p-3 rounded-md border hover:bg-accent/40"
              >
                <div className="font-medium">{c.title}</div>
                <div className="text-sm text-muted-foreground">{c.lastMessage}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1">
          <ChatWindow title={selectedChat ? mockChats.find((m) => m.id === selectedChat)?.title : undefined} chatId={selectedChat} userId={userId} />
        </div>
      </div>
    </div>
  );
}

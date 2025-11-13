"use client"

import { io, type Socket } from "socket.io-client";

let socket: Socket | null = null;

type InitOptions = {
  token?: string;
  backendUrl?: string;
  transports?: string[];
  autoConnect?: boolean;
  reconnection?: boolean;
};

export function initSocket(opts: InitOptions = {}) {
  if (socket) return socket;

  const { token, backendUrl, transports = ["websocket", "polling"], autoConnect = false, reconnection = true } = opts;
  const url = backendUrl ?? (typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_URL || window.location.origin) : undefined);

  // Use dynamic auth callback so token can be refreshed on connect_error
  socket = io(url as any, {
    autoConnect,
    transports,
    reconnection,
    auth: (cb: (auth: Record<string, any>) => void) => {
      const t = token ?? (typeof window !== "undefined" ? localStorage.getItem("token") : undefined);
      cb({ token: t });
    },
  });

  socket.on("connect_error", (err: any) => {
    // Example handling per docs: if auth failed, try to refresh token and reconnect
    try {
      if (err && err.message && /auth|credentials|invalid/i.test(err.message)) {
        // Attempt to refresh token (implement your refresh flow here)
        const refresh = (window as any).getNewToken?.();
        if (refresh && typeof refresh.then === "function") {
          refresh
            .then((newToken: string) => {
              socket && (socket.auth = { token: newToken });
              socket && socket.connect();
            })
            .catch(() => {
              // leave it disconnected; app should prompt for re-login
            });
        }
      }
    } catch (e) {
      // ignore
    }
  });

  // Connect now if autoConnect=false but we still want to start immediately
  try {
    if (!socket.connected && autoConnect !== false) socket.connect();
  } catch (e) {
    console.warn("socket connect failed", e);
  }

  // expose to window for other helpers (logout, debug)
  try {
    if (typeof window !== 'undefined') (window as any).getSocket = getSocket;
  } catch (e) {}

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch (e) {}
  socket = null;
}

"use client";

import { io, type Socket } from "socket.io-client";
import { getSocketBase } from "./api";

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

  const {
    token,
    backendUrl,
    transports = ["websocket", "polling"],
    autoConnect = false,
    reconnection = true,
  } = opts;
  const fallbackOrigin =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const url = (backendUrl || getSocketBase() || fallbackOrigin) as
    | string
    | undefined;
  if (!url) {
    throw new Error("Socket URL not configured");
  }

  // Use dynamic auth callback so token can be refreshed on connect_error
  socket = io(url as string, {
    autoConnect,
    transports,
    reconnection,
    auth: (cb: (auth: Record<string, unknown>) => void) => {
      const t =
        token ??
        (typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined);
      cb({ token: t });
    },
  });

  socket.on("connect_error", (err: unknown) => {
    // Example handling per docs: if auth failed, try to refresh token and reconnect
    try {
      const maybeErr = err as { message?: unknown };
      if (
        maybeErr &&
        typeof maybeErr.message === "string" &&
        /auth|credentials|invalid/i.test(maybeErr.message)
      ) {
        // Attempt to refresh token (implement your refresh flow here)
        const getter = window.getNewToken;
        if (typeof getter === "function") {
          const refresh = getter();
          if (
            refresh &&
            typeof (refresh as Promise<unknown>).then === "function"
          ) {
            (refresh as Promise<string>)
              .then((newToken: string) => {
                if (socket)
                  (socket as unknown as { auth?: unknown }).auth = {
                    token: newToken,
                  };
                if (socket) socket.connect();
              })
              .catch(() => {
                // leave it disconnected; app should prompt for re-login
              });
          }
        }
      }
    } catch {
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
    if (typeof window !== "undefined") {
      // expose typed getter
      window.getSocket = getSocket;
    }
  } catch {
    // ignore
  }

  return socket;
}

export function getSocket() {
  return socket;
}

export function closeSocket() {
  if (!socket) return;
  try {
    socket.disconnect();
  } catch {}
  socket = null;
}

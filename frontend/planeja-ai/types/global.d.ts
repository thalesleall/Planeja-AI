import type { Socket } from "socket.io-client";

declare global {
  interface Window {
    // token helpers
    refreshAuthToken?: () => Promise<string | null>;
    getNewToken?: () => Promise<string | null>;
    logoutAuth?: () => Promise<void>;
    setToken?: (t: string | null) => Promise<void> | void;
    getToken?: () => Promise<string | null> | string | null;
    // socket helper
    getSocket?: () => Socket | null;
  }
}

export {};

"use client"

import api from './api';

export async function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function setToken(token: string | null) {
  api.saveToken(token);
}

export async function refreshToken(): Promise<string | null> {
  try {
    const res = await api.auth.refresh();
    if (!res.ok) {
      console.warn('refreshToken failed', res.status);
      return null;
    }

    const newToken = res.data?.token ?? res.data?.accessToken ?? null;
    if (newToken) {
      await setToken(newToken);
      return newToken;
    }

    return null;
  } catch (err) {
    console.error('refreshToken error', err);
    return null;
  }
}

// Expose refresh helper to window for socket helper to call if present
if (typeof window !== "undefined") {
  window.refreshAuthToken = refreshToken;
  // also expose under legacy name expected by socket helper
  window.getNewToken = refreshToken;

  // add a logout helper for UI to call
  window.logoutAuth = async () => {
    try {
      await api.auth.logout();
    } catch (err) {
      console.error('logout failed', err);
    }
    await setToken(null);
    // disconnect socket if present
    try {
      const getter = window.getSocket;
      if (typeof getter === 'function') {
        const s = getter();
        if (s && typeof (s as { disconnect?: () => void }).disconnect === 'function') {
          (s as { disconnect: () => void }).disconnect();
        }
      }
    } catch {
      // ignore
    }
  };

  // expose helpers for other modules
  window.setToken = setToken;
  window.getToken = getToken;
}

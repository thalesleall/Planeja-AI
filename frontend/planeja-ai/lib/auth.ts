"use client"

export async function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export async function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

export async function refreshToken(): Promise<string | null> {
  try {
      const res = await fetch(`/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include', // send cookies (refresh token cookie)
        body: JSON.stringify({}),
      });

    if (!res.ok) {
      console.warn("refreshToken failed", res.status);
      return null;
    }

    const data = await res.json();
    const newToken = data?.token ?? data?.accessToken ?? null;
    if (newToken) {
      await setToken(newToken);
      return newToken;
    }

    return null;
  } catch (err) {
    console.error("refreshToken error", err);
    return null;
  }
}

// Expose refresh helper to window for socket helper to call if present
if (typeof window !== "undefined") {
  (window as any).refreshAuthToken = refreshToken;

  // add a logout helper for UI to call
  (window as any).logoutAuth = async () => {
    try {
      await fetch(`/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (e) {
      console.error('logout failed', e);
    }
    await setToken(null);
    // disconnect socket if present
    try { (window as any).getSocket && (window as any).getSocket().disconnect(); } catch (e) {}
  };
  // expose helpers for other modules
  (window as any).setToken = setToken;
  (window as any).getToken = getToken;
}

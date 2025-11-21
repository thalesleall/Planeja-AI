const BASE = process.env.NEXT_PUBLIC_API_URL || "";

const API_ORIGIN = deriveOrigin(BASE);
const SOCKET_BASE =
  process.env.NEXT_PUBLIC_SOCKET_URL || deriveSocketBase(BASE);

function buildQuery(
  params?: string | Record<string, string | number | boolean | undefined | null>
) {
  if (!params) return "";
  if (typeof params === "string") return params;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    search.append(key, String(value));
  });
  return search.toString();
}

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function saveToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const newToken = data?.token ?? data?.accessToken ?? null;
    if (newToken) saveToken(newToken);
    return newToken;
  } catch {
    return null;
  }
}

async function request(
  path: string,
  opts: RequestInit = {},
  attemptedRefresh = false
): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(opts.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && !(opts.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const merged: RequestInit = {
    credentials: "include",
    ...opts,
    headers,
  };

  const res = await fetch(`${BASE}${path}`, merged);

  if (res.status === 401 && !attemptedRefresh) {
    const newToken = await tryRefresh();
    if (newToken) {
      // retry original request with refreshed token
      return request(path, opts, true);
    }
  }

  return res;
}

export async function get(path: string) {
  const res = await request(path, { method: "GET" });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function post(path: string, body?: unknown) {
  const serializeBody = (b?: unknown): BodyInit | undefined => {
    if (b === undefined) return undefined;
    // If it's a FormData, pass through. Otherwise stringify.
    if (typeof FormData !== "undefined" && b instanceof FormData) return b;
    return JSON.stringify(b);
  };

  const res = await request(path, {
    method: "POST",
    body: serializeBody(body),
  });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function put(path: string, body?: unknown) {
  const serializeBody = (b?: unknown): BodyInit | undefined => {
    if (b === undefined) return undefined;
    if (typeof FormData !== "undefined" && b instanceof FormData) return b;
    return JSON.stringify(b);
  };

  const res = await request(path, { method: "PUT", body: serializeBody(body) });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function del(path: string) {
  const res = await request(path, { method: "DELETE" });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export function getApiBase() {
  return BASE;
}

export function getApiOrigin() {
  return API_ORIGIN;
}

export function getSocketBase() {
  return SOCKET_BASE;
}

export function resolveAttachmentUrl(path?: string | null) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const origin = getApiOrigin();
  if (!origin) {
    return path;
  }

  if (path.startsWith("/")) {
    return `${origin}${path}`;
  }

  return `${origin}/${path}`;
}

// High-level API helpers
export const auth = {
  register: (payload: unknown) => post("/auth/register", payload),
  login: (payload: unknown) => post("/auth/login", payload),
  me: () => get("/auth/me"),
  refresh: () => post("/auth/refresh", {}),
  logout: () => post("/auth/logout", {}),
  listTokens: () => get("/auth/refresh-tokens"),
  revokeToken: (id: string) => del(`/auth/refresh-tokens/${id}`),
};

export const lists = {
  getAll: () => get("/lists"),
  create: () => post("/lists", {}),
  getById: (id: string | number) => get(`/lists/${id}`),
  delete: (id: string | number) => del(`/lists/${id}`),
  createItem: (listId: string | number, payload: unknown) =>
    post(`/lists/${listId}/items`, payload),
};

export const tasks = {
  get: (
    query?:
      | string
      | Record<string, string | number | boolean | undefined | null>
  ) => {
    const qs = buildQuery(query);
    return get(`/tasks${qs ? `?${qs}` : ""}`);
  },
  getPending: () => get("/tasks/pending"),
  getCompleted: () => get("/tasks/completed"),
  create: (payload: unknown) => post("/tasks", payload),
  update: (id: string | number, payload: unknown) =>
    put(`/tasks/${id}`, payload),
  complete: (id: string | number, done?: boolean) =>
    put(`/tasks/${id}/complete`, typeof done === "boolean" ? { done } : {}),
  delete: (id: string | number) => del(`/tasks/${id}`),
};

export const chats = {
  list: () => get("/chats"),
  create: () => post("/chats", {}),
  getMessages: (chatId: string | number) => get(`/chats/${chatId}/messages`),
  postMessage: (payload: unknown) => post("/chats/messages", payload),
};

export const attachments = {
  upload: async (taskId: string | number, files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return post(`/tasks/${taskId}/attachments`, formData);
  },
  list: (taskId: string | number) => get(`/tasks/${taskId}/attachments`),
  delete: (taskId: string | number, attachmentId: string) =>
    del(`/tasks/${taskId}/attachments/${attachmentId}`),
  setCover: (taskId: string | number, attachmentId: string) =>
    put(`/tasks/${taskId}/attachments/${attachmentId}/set-cover`, {}),
};

// AI helpers backed by the Planeja-AI backend
export const ai = {
  suggest: (payload?: unknown) => post("/ai/tasks/suggest-title", payload),
};

export const api = {
  auth,
  lists,
  tasks,
  chats,
  attachments,
  ai,
  get,
  post,
  put,
  del,
  saveToken,
};

export default api;

function deriveOrigin(base: string) {
  if (!base) return "";
  try {
    const fallbackOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const target = new URL(base, fallbackOrigin);
    return `${target.protocol}//${target.host}`;
  } catch {
    return base.replace(/\/api\/v1$/, "");
  }
}

function deriveSocketBase(base?: string) {
  if (!base) return "";
  try {
    const fallbackOrigin =
      typeof window !== "undefined"
        ? window.location.origin
        : "http://localhost:3000";
    const target = new URL(base, fallbackOrigin);
    const cleanedPath = target.pathname
      .replace(/\/api\/v1$/, "")
      .replace(/\/$/, "");
    return `${target.protocol}//${target.host}${cleanedPath}`;
  } catch {
    return base.replace(/\/api\/v1$/, "");
  }
}

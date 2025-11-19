const BASE = process.env.NEXT_PUBLIC_API_URL || '';

function getStoredToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function saveToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}

async function tryRefresh() {
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
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

async function request(path: string, opts: RequestInit = {}, attemptedRefresh = false): Promise<Response> {
  const token = getStoredToken();

  const headers = new Headers(opts.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const merged: RequestInit = {
    credentials: 'include',
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
  const res = await request(path, { method: 'GET' });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function post(path: string, body?: unknown) {
  const serializeBody = (b?: unknown): BodyInit | undefined => {
    if (b === undefined) return undefined;
    // If it's a FormData, pass through. Otherwise stringify.
    if (typeof FormData !== 'undefined' && b instanceof FormData) return b;
    return JSON.stringify(b);
  };

  const res = await request(path, { method: 'POST', body: serializeBody(body) });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function put(path: string, body?: unknown) {
  const serializeBody = (b?: unknown): BodyInit | undefined => {
    if (b === undefined) return undefined;
    if (typeof FormData !== 'undefined' && b instanceof FormData) return b;
    return JSON.stringify(b);
  };

  const res = await request(path, { method: 'PUT', body: serializeBody(body) });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

export async function del(path: string) {
  const res = await request(path, { method: 'DELETE' });
  const json = await res.json().catch(() => ({} as unknown));
  return { ok: res.ok, status: res.status, data: json as unknown };
}

// High-level API helpers
export const auth = {
  register: (payload: unknown) => post('/auth/register', payload),
  login: (payload: unknown) => post('/auth/login', payload),
  me: () => get('/auth/me'),
  refresh: () => post('/auth/refresh', {}),
  logout: () => post('/auth/logout', {}),
  listTokens: () => get('/auth/refresh-tokens'),
  revokeToken: (id: string) => del(`/auth/refresh-tokens/${id}`),
};

export const lists = {
  getAll: () => get('/lists'),
  create: () => post('/lists', {}),
  getById: (id: string | number) => get(`/lists/${id}`),
  delete: (id: string | number) => del(`/lists/${id}`),
  createItem: (listId: string | number, payload: unknown) => post(`/lists/${listId}/items`, payload),
};

export const tasks = {
  get: (query = '') => get(`/tasks${query ? '?' + query : ''}`),
  getPending: () => get('/tasks/pending'),
  getCompleted: () => get('/tasks/completed'),
  create: (payload: unknown) => post('/tasks', payload),
  complete: (id: string | number) => put(`/tasks/${id}/complete`, {}),
  delete: (id: string | number) => del(`/tasks/${id}`),
};

export const chats = {
  list: () => get('/chats'),
  getMessages: (chatId: string | number) => get(`/chats/${chatId}/messages`),
  postMessage: (payload: unknown) => post('/chats/messages', payload),
};

export const attachments = {
  upload: async (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('taskId', taskId);
    return post('/attachments/upload', formData);
  },
  list: (taskId: string) => get(`/attachments/task/${taskId}`),
  delete: (attachmentId: string) => del(`/attachments/${attachmentId}`),
  setCover: (attachmentId: string) => put(`/attachments/${attachmentId}/cover`, {}),
};

// AI / local helper — the suggestion endpoint is a Next.js server route under /api
export const ai = {
  suggest: async (input?: unknown) => {
    try {
      const res = await fetch('/api/suggest-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input ?? {}),
      });
      const json = await res.json().catch(() => ({} as unknown));
      return { ok: res.ok, status: res.status, data: json as unknown };
    } catch {
      return { ok: false, status: 0, data: {} as unknown };
    }
  },
};

export const api = { auth, lists, tasks, chats, attachments, ai, get, post, put, del, saveToken };

export default api;

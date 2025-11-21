import crypto from "crypto";
import { supabase } from "../config/supabase";

export type RefreshTokenRecord = {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
};

const memoryTokens = new Map<string, RefreshTokenRecord>();
let useMemoryStore = false;

const FALLBACK_MESSAGES = [
  "invalid api key",
  "schema cache",
  "permission denied",
  "could not find the table",
];

const shouldFallback = (error?: { message?: string }) => {
  if (!error || !error.message) return false;
  const message = error.message.toLowerCase();
  return FALLBACK_MESSAGES.some((needle) => message.includes(needle));
};

const markMemoryMode = (reason?: string) => {
  if (!useMemoryStore) {
    useMemoryStore = true;
    console.warn(
      "⚠️  Falling back to in-memory refresh token store:",
      reason || "Unknown reason"
    );
  }
};

const createMemoryRecord = (
  payload: Omit<RefreshTokenRecord, "id" | "created_at">
): RefreshTokenRecord => {
  const record: RefreshTokenRecord = {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    ...payload,
  };
  memoryTokens.set(record.id, record);
  return record;
};

const findMemoryByToken = (token: string): RefreshTokenRecord | null => {
  for (const record of memoryTokens.values()) {
    if (record.token === token) return record;
  }
  return null;
};

const cleanMemoryExpired = () => {
  const now = Date.now();
  let removed = 0;
  for (const record of memoryTokens.values()) {
    if (new Date(record.expires_at).getTime() <= now) {
      memoryTokens.delete(record.id);
      removed += 1;
    }
  }
  return removed;
};

export const RefreshTokenStore = {
  usingMemory: () => useMemoryStore,

  async save(
    payload: Omit<RefreshTokenRecord, "id" | "created_at">
  ): Promise<RefreshTokenRecord> {
    if (useMemoryStore) {
      return createMemoryRecord(payload);
    }

    const { data, error } = await supabase
      .from("auth_refresh_tokens")
      .insert([payload])
      .select(
        "id, user_id, token, expires_at, ip_address, user_agent, created_at"
      )
      .single();

    if (!error && data) {
      return data as RefreshTokenRecord;
    }

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      return createMemoryRecord(payload);
    }

    throw new Error(error?.message || "Failed to store refresh token");
  },

  async findByToken(token: string): Promise<RefreshTokenRecord | null> {
    if (useMemoryStore) {
      return findMemoryByToken(token);
    }

    const { data, error } = await supabase
      .from("auth_refresh_tokens")
      .select(
        "id, user_id, token, expires_at, ip_address, user_agent, created_at"
      )
      .eq("token", token)
      .single();

    if (!error && data) return data as RefreshTokenRecord;
    if (!error) return null;

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      return findMemoryByToken(token);
    }

    throw new Error(error.message);
  },

  async getById(id: string): Promise<RefreshTokenRecord | null> {
    if (useMemoryStore) {
      return memoryTokens.get(id) || null;
    }

    const { data, error } = await supabase
      .from("auth_refresh_tokens")
      .select(
        "id, user_id, token, expires_at, ip_address, user_agent, created_at"
      )
      .eq("id", id)
      .single();

    if (!error && data) return data as RefreshTokenRecord;
    if (!error) return null;

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      return memoryTokens.get(id) || null;
    }

    throw new Error(error.message);
  },

  async deleteById(id: string): Promise<void> {
    if (useMemoryStore) {
      memoryTokens.delete(id);
      return;
    }

    const { error } = await supabase
      .from("auth_refresh_tokens")
      .delete()
      .eq("id", id);

    if (!error) return;

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      memoryTokens.delete(id);
      return;
    }

    throw new Error(error.message);
  },

  async deleteByToken(token: string): Promise<void> {
    if (useMemoryStore) {
      const record = findMemoryByToken(token);
      if (record) memoryTokens.delete(record.id);
      return;
    }

    const { error } = await supabase
      .from("auth_refresh_tokens")
      .delete()
      .eq("token", token);

    if (!error) return;

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      const record = findMemoryByToken(token);
      if (record) memoryTokens.delete(record.id);
      return;
    }

    throw new Error(error.message);
  },

  async listByUser(userId: string): Promise<RefreshTokenRecord[]> {
    if (useMemoryStore) {
      return Array.from(memoryTokens.values()).filter(
        (r) => String(r.user_id) === String(userId)
      );
    }

    const { data, error } = await supabase
      .from("auth_refresh_tokens")
      .select(
        "id, user_id, token, expires_at, ip_address, user_agent, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) return data as RefreshTokenRecord[];
    if (!error) return [];

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      return Array.from(memoryTokens.values()).filter(
        (r) => String(r.user_id) === String(userId)
      );
    }

    throw new Error(error.message);
  },

  async cleanupExpired(): Promise<{
    removed: number;
    storage: "memory" | "supabase";
  }> {
    if (useMemoryStore) {
      const removed = cleanMemoryExpired();
      return { removed, storage: "memory" };
    }

    const now = new Date().toISOString();
    const { error, count } = await supabase
      .from("auth_refresh_tokens")
      .delete({ count: "exact" })
      .lt("expires_at", now);

    if (!error) {
      return { removed: count || 0, storage: "supabase" };
    }

    if (shouldFallback(error)) {
      markMemoryMode(error?.message);
      const removed = cleanMemoryExpired();
      return { removed, storage: "memory" };
    }

    throw new Error(error.message);
  },
};

"use client";

import * as React from "react";
import api from "@/lib/api";

type TokenListResponse = {
  data?: TokenRow[];
  tokens?: TokenRow[];
};

type TokenRow = {
  id: string;
  ip_address?: string;
  user_agent?: string;
  expires_at?: string;
  created_at?: string;
};

export default function TokenList() {
  const [tokens, setTokens] = React.useState<TokenRow[]>([]);
  const [loading, setLoading] = React.useState(false);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      try {
        const res = await api.auth.listTokens();
        if (res.ok) {
          const payload = res.data as TokenListResponse | undefined;
          setTokens(payload?.data ?? payload?.tokens ?? []);
        } else console.warn("Failed to fetch tokens", res.status);
      } catch (err) {
        console.error(err);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const revoke = async (id: string) => {
    try {
      const res = await api.auth.revokeToken(id);
      if (res.ok) fetchTokens();
    } catch (e) {
      console.error(e);
    }
  };

  React.useEffect(() => {
    fetchTokens();
  }, []);

  if (loading) return <div>Loading tokens...</div>;

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">
        Active Sessions / Refresh Tokens
      </h3>
      <div className="mt-3 space-y-2">
        {tokens.length === 0 && (
          <div className="text-sm text-muted-foreground">No tokens found</div>
        )}
        {tokens.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div className="text-sm">
              <div className="font-medium">{t.user_agent ?? "Unknown"}</div>
              <div className="text-xs text-muted-foreground">
                IP: {t.ip_address ?? "Unknown"}
              </div>
              <div className="text-xs text-muted-foreground">
                Expires: {t.expires_at ?? "Unknown"}
              </div>
            </div>
            <div>
              <button
                className="px-2 py-1 bg-red-100 text-sm rounded"
                onClick={() => revoke(t.id)}
              >
                Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client"

import * as React from "react";
import { initSocket, getSocket, closeSocket } from "@/lib/socket";
import { getToken, refreshToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default function Header({ className }: { className?: string }) {
  const [status, setStatus] = React.useState<'connected'|'disconnected'|'connecting'>('connecting');

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (!token) {
        setStatus('disconnected');
        return;
      }

      // expose token refresh helper expected by socket helper
      (window as any).getNewToken = async () => {
        const t = await refreshToken();
        return t;
      };

      const socket = initSocket({ token, autoConnect: true });

      function onConnect() { if (!mounted) return; setStatus('connected'); }
      function onDisconnect() { if (!mounted) return; setStatus('disconnected'); }
      function onConnecting() { if (!mounted) return; setStatus('connecting'); }

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('reconnect_attempt', onConnecting);

      // set initial state
      setStatus(socket.connected ? 'connected' : 'connecting');

      return () => {
        mounted = false;
        try {
          socket.off('connect', onConnect);
          socket.off('disconnect', onDisconnect);
          socket.off('reconnect_attempt', onConnecting);
        } catch (e) {}
      };
    })();
  }, []);

  return (
    <header className={cn("w-full px-4 py-3 border-b bg-background flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">Planeja-AI</div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className={cn(
            'inline-block w-3 h-3 rounded-full',
            status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
          )} />
          <span className="text-sm text-muted-foreground">{status}</span>
        </div>
        <div>
          <button
            className="ml-4 px-3 py-1 rounded bg-gray-100 text-sm"
            onClick={async () => {
              try {
                // call logout endpoint and clear token
                await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
              } catch (e) {
                console.error('logout call failed', e);
              }
              try {
                await (window as any).setToken?.(null);
              } catch (e) {}
              try { const s = (window as any).getSocket?.(); s && s.disconnect(); } catch (e) {}
              // reload to show logged out state
              window.location.reload();
            }}
          >Logout</button>
        </div>
      </div>
    </header>
  );
}

import { testSupabaseConnection } from "../config/supabase";
import { RefreshTokenStore } from "../lib/refreshTokenStore";

// Simple periodic cleanup job to remove expired refresh tokens.
// Runs in-process. For scaled deployments prefer a dedicated worker or DB job.
export function startRefreshTokenCleanup(intervalMs = 1000 * 60 * 60) {
  // default: hourly
  async function cleanup() {
    try {
      // Ensure Supabase is reachable before attempting cleanup. If not, skip to avoid noisy errors.
      const ok = await testSupabaseConnection();
      if (!ok) {
        console.warn(
          "refreshTokenCleanup: Supabase not reachable; skipping cleanup this run."
        );
        return;
      }
      const now = new Date().toISOString();
      const result = await RefreshTokenStore.cleanupExpired();
      console.debug(
        `refreshTokenCleanup ran successfully at ${now} (${result.storage}) removed=${result.removed}`
      );
    } catch (err: any) {
      // Provide more context for network/fetch failures which are common in local dev when Supabase isn't running.
      if (err && err.message && err.message.includes("fetch failed")) {
        console.warn(
          "refreshTokenCleanup: network fetch failed when calling Supabase. Is SUPABASE_URL reachable?"
        );
      }
      console.error("refreshTokenCleanup unexpected error:", err);
    }
  }

  // Run immediately then schedule
  cleanup();
  const id = setInterval(cleanup, intervalMs);

  return () => clearInterval(id);
}

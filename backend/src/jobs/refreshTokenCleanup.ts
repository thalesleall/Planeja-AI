import { supabase } from '../config/supabase';

// Simple periodic cleanup job to remove expired refresh tokens.
// Runs in-process. For scaled deployments prefer a dedicated worker or DB job.
export function startRefreshTokenCleanup(intervalMs = 1000 * 60 * 60) {
  // default: hourly
  async function cleanup() {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('auth_refresh_tokens')
        .delete()
        .lt('expires_at', now);

      if (error) {
        console.error('refreshTokenCleanup error:', error);
      } else {
        console.debug('refreshTokenCleanup ran successfully at', now);
      }
    } catch (err) {
      console.error('refreshTokenCleanup unexpected error:', err);
    }
  }

  // Run immediately then schedule
  cleanup();
  const id = setInterval(cleanup, intervalMs);

  return () => clearInterval(id);
}

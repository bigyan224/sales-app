/**
 * Keeps Render free-tier instances awake.
 *
 * Render pauses a free web service after 15 minutes of no inbound traffic.
 * Pinging the app's own public `/api/health` on a timer counts as inbound
 * traffic, so the idle clock keeps resetting and the instance never sleeps.
 *
 * Requires `KEEP_ALIVE_URL` (the app's public URL, e.g. https://x.onrender.com).
 */
export function startKeepAlive({ url, intervalMinutes } = {}) {
  if (!url) {
    console.log('[keep-alive] disabled (KEEP_ALIVE_URL not set)');
    return;
  }

  const base = url.replace(/\/$/, '');
  const intervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

  const ping = async () => {
    try {
      await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(10000) });
    } catch (err) {
      console.warn(`[keep-alive] ping failed: ${err.message}`);
    }
  };

  ping();
  setInterval(ping, intervalMs);
  console.log(`[keep-alive] pinging ${base}/api/health every ${intervalMinutes} min`);
}

const NPT_OFFSET_MS = (5 * 60 + 45) * 60 * 1000;

/**
 * Formats an ISO timestamp in Nepal time (UTC+5:45), 12-hour with AM/PM.
 * Manual offset math so it works without full Intl timezone support.
 * Returns e.g. "04:23 PM". Empty string when input is missing/invalid.
 */
export function formatSaleTimeNpt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const npt = new Date(utc + NPT_OFFSET_MS);
  const h24 = npt.getHours();
  const m = npt.getMinutes();
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const hh = String(h12).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${ampm}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const pad2 = (n) => String(n).padStart(2, '0');

/** Indian/`en-IN` style grouping (last 3 digits, then groups of 2). */
function groupIndian(int) {
  if (int.length <= 3) return int;
  const last3 = int.slice(-3);
  const rest = int.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

/** Formats a money amount as `रू 1,23,456`. */
export function formatMoney(value) {
  const rounded = Math.round(value * 100) / 100;
  const negative = rounded < 0;
  const abs = Math.abs(rounded);
  const [int, dec] = abs.toFixed(2).split('.');
  const decimals = dec === '00' ? '' : '.' + dec.replace(/0$/, '');
  return `${negative ? '-रू ' : 'रू '}${groupIndian(int)}${decimals}`;
}

/** Compact money for chart axes: `रू 12k`, `रू 1.5L`, `रू 2Cr`. */
export function formatMoneyCompact(value) {
  const abs = Math.abs(value);
  if (abs >= 10000000) return `रू ${(value / 10000000).toFixed(1)}Cr`;
  if (abs >= 100000) return `रू ${(value / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `रू ${(value / 1000).toFixed(1)}k`;
  return `रू ${Math.round(value)}`;
}

/** Formats an ISO datetime as `Jul 31, 2026 10:45`. */
export function formatDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

/** Parses a user typed money string into a number or null. Accepts commas/spaces. */
export function parseMoney(value) {
  const cleaned = value.replace(/[,₹रू\s]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

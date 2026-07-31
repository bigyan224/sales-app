import NepaliDate from 'nepali-date-converter';

export const BS_MONTHS = [
  'Baisakh',
  'Jestha',
  'Asar',
  'Shrawan',
  'Bhadra',
  'Aswin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
];

export const BS_MONTHS_NP = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कात्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
];

const pad2 = (n) => String(n).padStart(2, '0');

/** Today's Bikram Sambat date from the device clock. */
export function todayBs() {
  const d = new NepaliDate();
  return { year: d.getYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function adToBs(date) {
  const d = new NepaliDate(date);
  return { year: d.getYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Converts BS parts to the equivalent AD `Date` at local midnight. */
export function bsToDate(parts) {
  return new NepaliDate(parts.year, parts.month - 1, parts.day).toJsDate();
}

/** BS parts -> `YYYY-MM-DD` (BS). */
export function bsDateString(parts) {
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}

/** BS parts -> zero-padded Gregorian `YYYY-MM-DD` string. */
export function bsToAdString(parts) {
  const d = bsToDate(parts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parses a `YYYY-MM-DD` BS string into parts, or null if malformed. */
export function parseBsDateString(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

/** Long English BS label, e.g. `Friday 15 Shrawan 2081`. */
export function formatBsLong(parts) {
  return new NepaliDate(parts.year, parts.month - 1, parts.day).format(
    'ddd DD MMMM YYYY',
  );
}

/** Devanagari BS label, e.g. `शुक्रबार १५ साउन २०८१`. */
export function formatBsNepali(parts) {
  return new NepaliDate(parts.year, parts.month - 1, parts.day).format(
    'ddd DD MMMM YYYY',
    'np',
  );
}

/** Number of days in a BS month (safe against out-of-range values). */
export function daysInBsMonth(year, month) {
  const clampedMonth = Math.min(Math.max(month, 1), 12);
  const start = new NepaliDate(year, clampedMonth - 1, 1).toJsDate().getTime();
  // Index 12 rolls over to the next year's Baisakh, which is what we want.
  const next = new NepaliDate(year, clampedMonth, 1).toJsDate().getTime();
  const diff = Math.round((next - start) / 86400000);
  return Math.max(diff, 28);
}

/** `YYYY-MM` BS month key, e.g. `2081-05`. */
export function bsMonthKey(parts) {
  return `${parts.year}-${pad2(parts.month)}`;
}

/** Parses a `YYYY-MM` BS month key into `{ year, month }` or null. */
export function parseBsMonthKey(key) {
  const m = /^(\d{4})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { year: Number(m[1]), month: Number(m[2]) };
}

/** Shifts a `YYYY-MM` key by `delta` months (handles year rollover). */
export function shiftBsMonth(key, delta) {
  const parsed = parseBsMonthKey(key);
  if (!parsed) return key;
  const index = (parsed.month - 1 + delta + 1200) % 12;
  const year = parsed.year + Math.floor((parsed.month - 1 + delta - index) / 12);
  return `${year}-${pad2(index + 1)}`;
}

export function monthLabel(month) {
  return BS_MONTHS[Math.min(Math.max(month, 1), 12) - 1];
}

export function formatBsMonthKey(key) {
  const parsed = parseBsMonthKey(key);
  if (!parsed) return key;
  return `${monthLabel(parsed.month)} ${parsed.year}`;
}

export function isSameBsDay(a, b) {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Shifts a BS date by `delta` calendar days (crosses month/year boundaries). */
export function addDays(parts, delta) {
  const d = bsToDate(parts);
  d.setDate(d.getDate() + delta);
  return adToBs(d);
}

/** Returns the Monday of the week containing `parts`. */
export function startOfWeek(parts) {
  const d = bsToDate(parts);
  const offset = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - offset);
  return adToBs(d);
}

/** The 7 BS dates of the week starting at `startParts` (Monday). */
export function weekDays(startParts) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(startParts, i));
  }
  return days;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Short English weekday, e.g. `Fri`. */
export function weekdayLabel(parts) {
  return WEEKDAY_LABELS[bsToDate(parts).getDay()];
}

export function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

export function isFiniteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function toNullableString(v) {
  if (typeof v !== 'string' || v.trim().length === 0) return null;
  return v.trim();
}

export function toNullableNumber(v) {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  return v;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isBsDateString(v) {
  return typeof v === 'string' && DATE_RE.test(v);
}

export function isAdDateString(v) {
  return typeof v === 'string' && DATE_RE.test(v);
}

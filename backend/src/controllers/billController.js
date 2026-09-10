import { ApiError } from '../middlewares/errorHandler.js';
import * as billService from '../services/billService.js';
import { isBsDateString, toNullableString } from '../utils/validation.js';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function parseIsoOrNull(v) {
  return typeof v === 'string' && ISO_RE.test(v) ? v : null;
}

/**
 * Validates and normalizes a raw client payload into a bill object, or null
 * if invalid. `name` and `bsDate` are required; the photo URL may arrive
 * later once the phone finishes uploading it.
 */
export function parseBillPayload(body) {
  if (!body || typeof body !== 'object') return null;

  const id =
    typeof body.id === 'string' && body.id
      ? body.id
      : typeof body._id === 'string' && body._id
        ? body._id
        : null;
  if (!id) return null;

  const name = toNullableString(body.name);
  if (!name) return null;
  if (!isBsDateString(body.bsDate)) return null;

  const now = new Date().toISOString();
  const syncStatus =
    body.syncStatus === 'deleted' || body.syncStatus === 'pending'
      ? body.syncStatus
      : 'synced';

  return {
    id,
    name,
    bsDate: body.bsDate,
    adDate: parseIsoOrNull(body.adDate) ?? toNullableString(body.adDate),
    notes: toNullableString(body.notes),
    imageUrl: toNullableString(body.imageUrl),
    createdAt: parseIsoOrNull(body.createdAt) ?? now,
    updatedAt: parseIsoOrNull(body.updatedAt) ?? now,
    syncStatus,
    deletedAt: typeof body.deletedAt === 'string' ? body.deletedAt : null,
  };
}

export async function listBills(req, res, next) {
  try {
    const { since, limit, offset } = req.query;
    const result = await billService.getBills({
      since,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getBill(req, res, next) {
  try {
    const bill = await billService.getBillById(req.params.id);
    if (!bill) throw new ApiError(404, 'Bill not found');
    res.json({ bill });
  } catch (err) {
    next(err);
  }
}

export async function createBill(req, res, next) {
  try {
    const bill = parseBillPayload(req.body);
    if (!bill) throw new ApiError(400, 'Invalid bill payload');
    await billService.batchSync([bill]);
    res.status(201).json({ bill });
  } catch (err) {
    next(err);
  }
}

export async function updateBill(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await billService.getBillById(id);
    if (!existing) throw new ApiError(404, 'Bill not found');

    const bill = parseBillPayload({
      ...req.body,
      id,
      createdAt: existing.createdAt,
    });
    if (!bill) throw new ApiError(400, 'Invalid bill payload');
    await billService.batchSync([bill]);
    res.json({ bill });
  } catch (err) {
    next(err);
  }
}

export async function deleteBill(req, res, next) {
  try {
    const deleted = await billService.deleteBillById(req.params.id);
    if (!deleted) throw new ApiError(404, 'Bill not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function batchSync(req, res, next) {
  try {
    const items = Array.isArray(req.body?.bills) ? req.body.bills : [];
    const bills = items
      .map((raw) => parseBillPayload(raw))
      .filter((bill) => bill !== null);

    const results = await billService.batchSync(bills);
    res.json({ results, accepted: results.length });
  } catch (err) {
    next(err);
  }
}

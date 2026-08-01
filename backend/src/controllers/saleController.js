import { ApiError } from '../middlewares/errorHandler.js';
import * as saleService from '../services/saleService.js';
import {
  isAdDateString,
  isBsDateString,
  isFiniteNumber,
  toNullableNumber,
  toNullableString,
} from '../utils/validation.js';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function parseIsoOrNull(v) {
  return typeof v === 'string' && ISO_RE.test(v) ? v : null;
}

/**
 * Validates and normalizes a raw client payload into a sale object, or null if
 * invalid.
 */
export function parseSalePayload(body) {
  if (!body || typeof body !== 'object') return null;

  const id =
    typeof body.id === 'string' && body.id
      ? body.id
      : typeof body._id === 'string' && body._id
        ? body._id
        : null;
  if (!id) return null;
  if (!isBsDateString(body.bsDate)) return null;
  if (!isAdDateString(body.adDate)) return null;
  if (!isFiniteNumber(body.salesAmount) || body.salesAmount < 0) return null;

  const now = new Date().toISOString();
  const syncStatus =
    body.syncStatus === 'deleted' || body.syncStatus === 'pending'
      ? body.syncStatus
      : 'synced';

  return {
    id,
    bsDate: body.bsDate,
    adDate: body.adDate,
    title: toNullableString(body.title),
    salesAmount: body.salesAmount,
    profit: toNullableNumber(body.profit),
    paymentStatus: body.paymentStatus === 'pending' ? 'pending' : 'paid',
    createdAt: parseIsoOrNull(body.createdAt) ?? now,
    updatedAt: parseIsoOrNull(body.updatedAt) ?? now,
    syncStatus,
    deletedAt: typeof body.deletedAt === 'string' ? body.deletedAt : null,
  };
}

export async function listSales(req, res, next) {
  try {
    const { since, bsDate, bsMonth, q, limit, offset } = req.query;
    const result = await saleService.getSales({
      since,
      bsDate,
      bsMonth,
      q,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getSale(req, res, next) {
  try {
    const sale = await saleService.getSaleById(req.params.id);
    if (!sale) throw new ApiError(404, 'Sale not found');
    res.json({ sale });
  } catch (err) {
    next(err);
  }
}

export async function createSale(req, res, next) {
  try {
    const sale = parseSalePayload(req.body);
    if (!sale) throw new ApiError(400, 'Invalid sale payload');
    await saleService.batchSync([sale]);
    res.status(201).json({ sale });
  } catch (err) {
    next(err);
  }
}

export async function updateSale(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await saleService.getSaleById(id);
    if (!existing) throw new ApiError(404, 'Sale not found');

    const sale = parseSalePayload({ ...req.body, id, createdAt: existing.createdAt });
    if (!sale) throw new ApiError(400, 'Invalid sale payload');
    await saleService.batchSync([sale]);
    res.json({ sale });
  } catch (err) {
    next(err);
  }
}

export async function deleteSale(req, res, next) {
  try {
    const deleted = await saleService.deleteSaleById(req.params.id);
    if (!deleted) throw new ApiError(404, 'Sale not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function batchSync(req, res, next) {
  try {
    const items = Array.isArray(req.body?.sales) ? req.body.sales : [];
    const sales = items
      .map((raw) => parseSalePayload(raw))
      .filter((sale) => sale !== null);

    const results = await saleService.batchSync(sales);
    res.json({ results, accepted: results.length });
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req, res, next) {
  try {
    const { bsDate, bsMonth } = req.query;
    const summary = await saleService.getSummary({ bsDate, bsMonth });
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

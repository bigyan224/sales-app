import { ApiError } from '../middlewares/errorHandler.js';
import * as productService from '../services/productService.js';
import { isFiniteNumber, toNullableString } from '../utils/validation.js';

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

function parseIsoOrNull(v) {
  return typeof v === 'string' && ISO_RE.test(v) ? v : null;
}

/**
 * Validates and normalizes a raw client payload into a product object, or null
 * if invalid. Only `name` and `price` are required; everything else is
 * optional.
 */
export function parseProductPayload(body) {
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
  if (!isFiniteNumber(body.price) || body.price < 0) return null;

  const now = new Date().toISOString();
  const syncStatus =
    body.syncStatus === 'deleted' || body.syncStatus === 'pending'
      ? body.syncStatus
      : 'synced';

  return {
    id,
    name,
    category: toNullableString(body.category),
    unit: toNullableString(body.unit),
    price: body.price,
    notes: toNullableString(body.notes),
    imageUrl: toNullableString(body.imageUrl),
    createdAt: parseIsoOrNull(body.createdAt) ?? now,
    updatedAt: parseIsoOrNull(body.updatedAt) ?? now,
    syncStatus,
    deletedAt: typeof body.deletedAt === 'string' ? body.deletedAt : null,
  };
}

export async function listProducts(req, res, next) {
  try {
    const { since, limit, offset } = req.query;
    const result = await productService.getProducts({
      since,
      limit: limit !== undefined ? Number(limit) : undefined,
      offset: offset !== undefined ? Number(offset) : undefined,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);
    if (!product) throw new ApiError(404, 'Product not found');
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = parseProductPayload(req.body);
    if (!product) throw new ApiError(400, 'Invalid product payload');
    await productService.batchSync([product]);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const id = req.params.id;
    const existing = await productService.getProductById(id);
    if (!existing) throw new ApiError(404, 'Product not found');

    const product = parseProductPayload({
      ...req.body,
      id,
      createdAt: existing.createdAt,
    });
    if (!product) throw new ApiError(400, 'Invalid product payload');
    await productService.batchSync([product]);
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const deleted = await productService.deleteProductById(req.params.id);
    if (!deleted) throw new ApiError(404, 'Product not found');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function batchSync(req, res, next) {
  try {
    const items = Array.isArray(req.body?.products) ? req.body.products : [];
    const products = items
      .map((raw) => parseProductPayload(raw))
      .filter((product) => product !== null);

    const results = await productService.batchSync(products);
    res.json({ results, accepted: results.length });
  } catch (err) {
    next(err);
  }
}

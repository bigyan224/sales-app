import * as FileSystem from 'expo-file-system/legacy';
import { productRepository } from '../db/productRepository';

const CACHE_DIR = `${FileSystem.documentDirectory}product-images/`;
const LEGACY_CACHE_DIR = `${FileSystem.cacheDirectory}product-images/`;

/**
 * Ensures the cache directory exists (migrates from cacheDirectory if needed).
 */
async function ensureCacheDir() {
  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    // Migrate legacy cache if present (older builds used cacheDirectory).
    try {
      const legacy = await FileSystem.getInfoAsync(LEGACY_CACHE_DIR);
      if (legacy.exists) {
        const files = await FileSystem.readDirectoryAsync(LEGACY_CACHE_DIR);
        for (const f of files) {
          try {
            await FileSystem.moveAsync({
              from: `${LEGACY_CACHE_DIR}${f}`,
              to: `${CACHE_DIR}${f}`,
            });
          } catch {
            // ignore individual migration failures
          }
        }
      }
    } catch {
      // ignore migration errors
    }
  }
}

function fileNameFor(product) {
  // Use product id + sanitized extension (default jpg). Cloudinary URLs may not have extension.
  const url = product.imageUrl || '';
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  const ext = match ? match[1].toLowerCase().slice(0, 4) : 'jpg';
  const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : 'jpg';
  return `${product.id}.${safeExt}`;
}

/**
 * Downloads a single product's remote image to local storage and records the
 * file path in the DB. Returns true on success.
 */
async function cacheOne(product) {
  if (!product.imageUrl) return false;
  try {
    await ensureCacheDir();
    const target = `${CACHE_DIR}${fileNameFor(product)}`;
    // If already cached and file exists with valid size, just ensure DB points to it
    if (product.cachedImageUri) {
      const info = await FileSystem.getInfoAsync(product.cachedImageUri);
      if (info.exists && info.size > 100) {
        return true;
      }
    }
    const temp = `${target}.tmp`;
    try {
      await FileSystem.deleteAsync(temp, { idempotent: true });
    } catch {}
    const download = await FileSystem.downloadAsync(product.imageUrl, temp);
    if (download.status !== 200) {
      try {
        await FileSystem.deleteAsync(temp, { idempotent: true });
      } catch {}
      return false;
    }
    const tempInfo = await FileSystem.getInfoAsync(temp);
    if (!tempInfo.exists || (tempInfo.size !== undefined && tempInfo.size < 100)) {
      try {
        await FileSystem.deleteAsync(temp, { idempotent: true });
      } catch {}
      return false;
    }
    // Move temp to final location (atomic)
    try {
      await FileSystem.deleteAsync(target, { idempotent: true });
    } catch {}
    await FileSystem.moveAsync({ from: temp, to: target });
    await productRepository.setCachedImageUri(product.id, target);
    return true;
  } catch (err) {
    // Network offline or server error — keep as pending for next sync.
    console.warn('[imageCache] failed for', product.id, err?.message ?? err);
    return false;
  }
}

/**
 * After products are pulled from the server, cache any remote images locally
 * so they are available offline. Runs in background, never throws.
 * Processes up to all pending images sequentially to avoid saturating the network.
 */
export async function cacheRemoteProductImages() {
  try {
    await ensureCacheDir();
    // Verify already-cached files still exist and are valid (user may have cleared storage or download was interrupted).
    const allActive = await productRepository.getAllActiveProducts();
    for (const p of allActive) {
      if (p.cachedImageUri && p.imageUrl) {
        const info = await FileSystem.getInfoAsync(p.cachedImageUri);
        if (!info.exists || (info.size !== undefined && info.size < 100)) {
          await productRepository.clearCachedImageUri(p.id);
          if (info.exists) {
            try {
              await FileSystem.deleteAsync(p.cachedImageUri, { idempotent: true });
            } catch {}
          }
        }
      } else if (p.cachedImageUri && !p.imageUrl) {
        // Remote image removed - clean orphan cache
        try {
          await FileSystem.deleteAsync(p.cachedImageUri, { idempotent: true });
        } catch {}
        await productRepository.clearCachedImageUri(p.id);
      }
    }
    const toCache = await productRepository.getProductsNeedingImageCache();
    if (toCache.length === 0) return;
    for (const product of toCache) {
      // Sequential to be gentle on Render free tier + mobile data
      // eslint-disable-next-line no-await-in-loop
      await cacheOne(product);
    }
  } catch (err) {
    console.warn('[imageCache] cacheRemoteProductImages failed:', err?.message ?? err);
  }
}

/**
 * Returns the best image URI for a product, preferring local files for offline.
 * Priority: localImageUri (user-picked, not yet uploaded) > cachedImageUri (downloaded remote) > imageUrl (remote).
 * Use this in <Image source={{ uri: ... }} />.
 */
export function getProductImageUri(product) {
  if (!product) return null;
  if (product.localImageUri) return product.localImageUri;
  if (product.cachedImageUri) return product.cachedImageUri;
  if (product.imageUrl) return product.imageUrl;
  return null;
}

/**
 * Ensures a single product's image is cached - can be called from UI when product has imageUrl but no cached file.
 * Deduplicates concurrent downloads.
 */
const _inProgress = new Set();
export async function ensureImageCached(product) {
  if (!product?.imageUrl || product.cachedImageUri || product.localImageUri) return;
  if (_inProgress.has(product.id)) return;
  _inProgress.add(product.id);
  try {
    await cacheOne(product);
    // Refresh store so UI picks up cachedImageUri without needing full sync
    try {
      const { useProductsStore } = await import('../state/productStore.js');
      await useProductsStore.getState().refresh();
    } catch {}
  } finally {
    _inProgress.delete(product.id);
  }
}

/**
 * Removes the cached file for a product (called when product is deleted or image removed).
 */
export async function deleteCachedImage(productId, cachedUri) {
  if (!cachedUri) return;
  try {
    await FileSystem.deleteAsync(cachedUri, { idempotent: true });
  } catch {}
  try {
    await productRepository.clearCachedImageUri(productId);
  } catch {}
}

export { cacheOne as cacheSingleProductImage };

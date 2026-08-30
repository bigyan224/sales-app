import * as FileSystem from 'expo-file-system';
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
    const existing = await FileSystem.getInfoAsync(target);
    // If file already exists and DB already points to it, skip download.
    // But we still need to ensure DB has correct uri (caller checks cached_image_uri IS NULL).
    const download = await FileSystem.downloadAsync(product.imageUrl, target);
    if (download.status !== 200) {
      // Cleanup failed download
      try {
        await FileSystem.deleteAsync(target, { idempotent: true });
      } catch {}
      return false;
    }
    await productRepository.setCachedImageUri(product.id, download.uri);
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
    // Verify already-cached files still exist (user may have cleared storage).
    const allActive = await productRepository.getAllActiveProducts();
    for (const p of allActive) {
      if (p.cachedImageUri && p.imageUrl) {
        const info = await FileSystem.getInfoAsync(p.cachedImageUri);
        if (!info.exists) {
          await productRepository.clearCachedImageUri(p.id);
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

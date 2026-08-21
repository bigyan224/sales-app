import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET } from '../config';
import { productRepository } from '../db/productRepository';

/**
 * Product photos are optional. A photo (camera or gallery) is stored on the
 * device immediately (`local_image_uri`), then uploaded straight to Cloudinary
 * with an unsigned preset — no backend involved, so uploads work even while
 * the server is asleep. Uploads that fail (offline) are retried during each
 * successful sync.
 */

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1';

const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 0.4,
};

export function isImageUploadConfigured() {
  return Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);
}

/** Ask the user whether to shoot a photo or pick one from the gallery. */
function chooseImageSource() {
  return new Promise((resolve) => {
    Alert.alert('Product Photo', 'Where should the picture come from?', [
      { text: 'Camera', onPress: () => resolve('camera') },
      { text: 'Gallery', onPress: () => resolve('gallery') },
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
    ], { cancelable: true, onDismiss: () => resolve(null) });
  });
}

async function launchCamera() {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

async function launchGallery() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  return result.assets[0].uri;
}

export async function pickProductImage() {
  const source = await chooseImageSource();
  if (source === 'camera') return launchCamera();
  if (source === 'gallery') return launchGallery();
  return null;
}

/** Uploads a local photo and returns its hosted URL. Throws when offline. */
export async function uploadProductImage(localUri) {
  if (!isImageUploadConfigured()) {
    throw new Error('Image upload is not configured');
  }
  const formData = new FormData();
  formData.append('file', { uri: localUri, name: 'product.jpg', type: 'image/jpeg' });
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const { data } = await axios.post(
    `${CLOUDINARY_URL}/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 30000 },
  );
  return data.secure_url;
}

/**
 * Uploads every product photo that is still local-only. Called inside the sync
 * cycle; individual failures are swallowed so one bad photo never blocks the
 * rest.
 */
export async function flushPendingProductUploads() {
  if (!isImageUploadConfigured()) return;
  const pending = await productRepository.getProductsWithLocalImageOnly();
  for (const product of pending) {
    try {
      const url = await uploadProductImage(product.localImageUri);
      await productRepository.setImageUrl(product.id, url);
    } catch (err) {
      // Keep the local photo; it will be retried on the next sync.
      break;
    }
  }
}

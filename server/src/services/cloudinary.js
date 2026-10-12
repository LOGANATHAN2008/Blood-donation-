const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Generate a signed upload signature for direct browser upload.
 * Options: folder, allowed_formats, max_file_size, timestamp.
 */
function generateSignature(options = {}) {
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder:          options.folder || 'lifeconnect/medicines',
    allowed_formats: options.allowed_formats || 'jpg,jpeg,png,webp',
    max_file_size:   5242880, // 5 MB
    ...options.extra,
  };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return { timestamp, signature, ...params, cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY };
}

/**
 * Delete a Cloudinary asset by its public_id.
 */
async function deleteAsset(publicId) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
}

/**
 * Upload an image directly from a URL to Cloudinary.
 */
async function uploadFromUrl(url, folder = 'lifeconnect/profiles') {
  if (!url) return null;
  try {
    const result = await cloudinary.uploader.upload(url, { folder });
    return { secure_url: result.secure_url, public_id: result.public_id };
  } catch (err) {
    console.error('Cloudinary upload error:', err.message);
    return null;
  }
}

module.exports = { cloudinary, generateSignature, deleteAsset, uploadFromUrl };

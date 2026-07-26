/**
 * Cloudinary Storage Integration Service
 * Manages raw file uploading for exam papers and booklets
 * Fallbacks to local files if Cloudinary credentials are not set
 */
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁ [Cloudinary] Initialized successfully.');
} else {
  console.log('☁ [Cloudinary] No cloud credentials detected in .env. Defaulting to local storage.');
}

/**
 * Upload local file to Cloudinary
 * @param {string} localFilePath - Path of file on local disk
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<string>} File URL (Cloud URL or Local relative fallback)
 */
const uploadToCloudinary = async (localFilePath, folder = 'exam-automation') => {
  try {
    if (!localFilePath) return '';

    if (!isConfigured) {
      // Local fallback url path mapper
      // e.g. "C:/Users/.../server/uploads/file.pdf" -> "/uploads/file.pdf"
      const normalizedPath = localFilePath.replace(/\\/g, '/');
      const match = normalizedPath.match(/\/uploads\/.+/);
      return match ? match[0] : normalizedPath;
    }

    console.log(`☁ [Cloudinary] Uploading ${localFilePath} to folder '${folder}'...`);
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: folder,
      resource_type: 'raw' // Required for PDF/Docx raw file uploads
    });

    // Successfully uploaded to Cloudinary. Remove temporary file from local disk.
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log('☁ [Cloudinary] Cleaned up temporary local file:', localFilePath);
      }
    } catch (err) {
      console.warn('☁ [Cloudinary] Could not delete local temporary file:', err.message);
    }

    return result.secure_url;
  } catch (error) {
    console.error('☁ [Cloudinary] Upload failed. Falling back to local URL. Error:', error);
    const normalizedPath = localFilePath.replace(/\\/g, '/');
    const match = normalizedPath.match(/\/uploads\/.+/);
    return match ? match[0] : normalizedPath;
  }
};

module.exports = {
  uploadToCloudinary,
  isConfigured
};

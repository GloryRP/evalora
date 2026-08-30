/**
 * File Proxy Route
 * Serves answer script PDFs (Cloudinary raw uploads or local disk files) to
 * authenticated users. Registered BEFORE the examcell router so that the
 * global `verifyToken` middleware on that router does not intercept this path.
 *
 * Auth: accepts JWT from:
 *   - Authorization: Bearer <token>   (API calls / Axios)
 *   - ?token=<jwt>                    (iframes, which cannot set custom headers)
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary once (if credentials are available)
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

/**
 * GET /api/v1/file-proxy?url=<encoded>&token=<jwt>
 *
 * Streams a PDF to the browser. Supports both Cloudinary raw uploads
 * (fetched via signed URL) and local /uploads/ files (served from disk).
 */
router.get('/', async (req, res) => {
  // ── Step 1: Authenticate ───────────────────────────────────────────────────
  try {
    const authHeader = req.headers.authorization;
    const rawToken = (authHeader && authHeader.startsWith('Bearer '))
      ? authHeader.substring(7)
      : req.query.token;

    if (!rawToken) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Throws if token is invalid or expired
    jwt.verify(rawToken, process.env.JWT_SECRET);
  } catch (_authErr) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }

  // ── Step 2: Serve the file ─────────────────────────────────────────────────
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ success: false, message: '?url= query param is required' });
    }

    const decodedUrl = decodeURIComponent(url);

    // ── Case A: Local /uploads/ path — serve directly from disk
    if (decodedUrl.startsWith('/uploads/') || !decodedUrl.startsWith('http')) {
      const localPath = path.join(__dirname, '..', decodedUrl.startsWith('/')
        ? decodedUrl
        : '/' + decodedUrl);

      if (!fs.existsSync(localPath)) {
        return res.status(404).json({ success: false, message: 'File not found on disk' });
      }

      return res.sendFile(localPath);
    }

    // ── Case B: Cloudinary URL — generate signed download URL and pipe
    if (
      isCloudinaryConfigured &&
      (decodedUrl.includes('res.cloudinary.com') || decodedUrl.includes('cloudinary.com'))
    ) {
      // Extract public_id from URL
      // e.g. https://res.cloudinary.com/<cloud>/raw/upload/v1234/folder/file.pdf
      //                                                            ^^^^^^^^^^^^^^^^ → public_id
      const match = decodedUrl.match(/\/(?:raw|image|video)\/upload\/(?:v\d+\/)?(.+)$/);
      if (!match) {
        return res.status(400).json({
          success: false,
          message: 'Cannot parse Cloudinary public_id from URL'
        });
      }

      const publicId = match[1]; // e.g. "answer-scripts/qvwu2mg2rczjhqxuqm4h.pdf"

      // Generate a 5-minute signed download URL
      const signedUrl = cloudinary.utils.private_download_url(publicId, '', {
        resource_type: 'raw',
        type: 'upload',
        expires_at: Math.floor(Date.now() / 1000) + 300
      });

      const cloudRes = await axios.get(signedUrl, { responseType: 'stream' });
      res.setHeader('Content-Type', cloudRes.headers['content-type'] || 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      return cloudRes.data.pipe(res);
    }

    // ── Case C: Other HTTP URL — try to fetch and proxy directly
    const fallbackRes = await axios.get(decodedUrl, { responseType: 'stream' });
    res.setHeader('Content-Type', fallbackRes.headers['content-type'] || 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    return fallbackRes.data.pipe(res);

  } catch (err) {
    console.error('[file-proxy] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to proxy file',
      error: err.message
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, logout, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user and get JWT token
 * @access  Public
 */
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Username is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  login
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user (client-side clears token)
 * @access  Public
 */
router.post('/logout', logout);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current logged-in user's info
 * @access  Private (requires valid JWT)
 */
router.get('/me', verifyToken, getMe);

module.exports = router;

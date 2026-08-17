const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { login, logout, getMe, changePassword, updateProfile } = require('../controllers/authController');
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

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Change user password
 * @access  Private (any role)
 */
router.patch(
  '/change-password',
  verifyToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[A-Za-z])(?=.*\d)/)
      .withMessage('New password must contain at least one letter and one number'),
    body('confirmPassword')
      .notEmpty()
      .withMessage('Confirm password is required'),
  ],
  changePassword
);

/**
 * @route   PATCH /api/v1/auth/update-profile
 * @desc    Update user profile (email, phone)
 * @access  Private (any role)
 */
router.patch(
  '/update-profile',
  verifyToken,
  [
    body('email')
      .optional()
      .isEmail()
      .withMessage('Invalid email format'),
    body('phone')
      .optional()
      .matches(/^\d{10}$/)
      .withMessage('Phone must be 10 digits'),
  ],
  updateProfile
);

module.exports = router;

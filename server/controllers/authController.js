const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * login - Authenticates a user and returns a JWT token
 * POST /api/v1/auth/login
 * Body: { username, password }
 * Returns: JWT token + user info (without passwordHash)
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required.',
      });
    }

    // Find user by username (case-insensitive by converting to uppercase)
    const user = await User.findOne({ username: username.toUpperCase() });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.',
      });
    }

    // Generate JWT token with 8-hour expiry
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expires in 8 hours
    );

    // Return success response with token and user info (exclude passwordHash)
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login.',
    });
  }
};

/**
 * logout - Simple logout endpoint
 * POST /api/v1/auth/logout
 * Since we're using stateless JWT, the frontend just clears the token
 * This endpoint exists for completeness and future session management if needed
 */
const logout = (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful. Please clear your token on the client side.',
  });
};

/**
 * getMe - Returns the currently logged-in user's info
 * GET /api/v1/auth/me
 * Requires: verifyToken middleware (uses req.user from JWT)
 */
const getMe = async (req, res) => {
  try {
    // req.user is set by verifyToken middleware
    const user = await User.findById(req.user.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name,
        department: user.department,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while fetching user info.',
    });
  }
};

/**
 * changePassword - Change user password
 * PATCH /api/v1/auth/change-password
 * Requires: verifyToken middleware
 * Body: { currentPassword, newPassword, confirmPassword }
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Check if new password matches confirm password
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check if new password is different from current
    if (newPassword === currentPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from current password'
      });
    }

    // Find user
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.findByIdAndUpdate(req.user.userId, {
      passwordHash: newPasswordHash,
      isFirstLogin: false,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

/**
 * updateProfile - Update user profile information
 * PATCH /api/v1/auth/update-profile
 * Requires: verifyToken middleware
 * Body: { email?, phone? }
 */
const updateProfile = async (req, res) => {
  try {
    const { email, phone } = req.body;
    const updateData = {};

    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    updateData.updatedAt = new Date();

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, select: '-passwordHash' }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

module.exports = { login, logout, getMe, changePassword, updateProfile };

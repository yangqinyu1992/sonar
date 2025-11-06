/*
 * 认证与用户路由
 * 路径前缀：/api/auth
 * - POST /api/auth/register  —— 注册用户到 MongoDB（users 集合），body: { username, password, nickname? }
 * - POST /api/auth/login     —— 登录并签发 JWT，body: { username, password }
 * - GET  /api/auth/profile   —— 获取当前用户信息（需 Authorization: Bearer <token>）
 * 关键环境变量：
 * - JWT_SECRET：JWT 密钥（务必在生产修改）
 * - JWT_EXPIRES_IN：JWT 过期时间（如 7d）
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// POST /api/auth/register { username, password }
router.post('/register', express.json(), async (req, res) => {
  try {
    const { username, password, nickname } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'username & password required' });
    const existed = await User.findOne({ username });
    if (existed) return res.status(409).json({ message: 'username already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, passwordHash, nickname });
    return res.status(201).json({ id: user._id, username: user.username });
  } catch (e) {
    return res.status(500).json({ message: 'register failed' });
  }
});

// POST /api/auth/login { username, password }
router.post('/login', express.json(), async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ message: 'username & password required' });
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'invalid credentials' });
    const token = signToken({ uid: String(user._id), username: user.username, roles: user.roles || [] });
    return res.json({ token, user: { id: user._id, username: user.username, nickname: user.nickname, roles: user.roles } });
  } catch (e) {
    return res.status(500).json({ message: 'login failed' });
  }
});

// GET /api/auth/profile (auth required)
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.uid).select('_id username nickname roles createdAt');
    if (!user) return res.status(404).json({ message: 'user not found' });
    return res.json({ user });
  } catch (e) {
    return res.status(500).json({ message: 'fetch profile failed' });
  }
});

// POST /api/auth/change-password { oldPassword, newPassword } (auth required)
router.post('/change-password', authMiddleware, express.json(), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Old password and new password are required' });
    }

    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid old password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Password changed successfully' });
  } catch (e) {
    console.error('Change password failed:', e);
    return res.status(500).json({ message: 'Change password failed' });
  }
});

// POST /api/auth/forgot-password { username }
router.post('/forgot-password', express.json(), async (req, res) => {
  try {
    const { username } = req.body || {};
    if (!username) {
      return res.status(400).json({ message: 'Username is required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      // For security, don't reveal if user exists or not
      return res.json({ message: 'If a matching account is found, a password reset token will be sent.' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // In a real application, you would email this token to the user.
    // For this demo, we'll return it in the response.
    return res.json({ message: 'Password reset token generated', resetToken });
  } catch (e) {
    console.error('Forgot password failed:', e);
    return res.status(500).json({ message: 'Forgot password failed' });
  }
});

// POST /api/auth/reset-password/:token { newPassword }
router.post('/reset-password/:token', express.json(), async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body || {};

    if (!newPassword) {
      return res.status(400).json({ message: 'New password is required' });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset successfully.' });
  } catch (e) {
    console.error('Reset password failed:', e);
    return res.status(500).json({ message: 'Reset password failed' });
  }
});

module.exports = { router, authMiddleware };

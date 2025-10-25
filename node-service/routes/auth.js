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

module.exports = router;

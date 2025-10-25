/*
 * 版本信息与广播路由
 * 路径前缀：/api/version
 * - GET  /api/version                —— 获取当前版本信息 { version, buildTime, commit }
 * - POST /api/version/broadcast      —— 主动广播版本到所有 WS 客户端（需 x-admin-token）
 *   头部：x-admin-token = VERSION_BROADCAST_TOKEN
 *   请求体（可选覆盖）：{ version?, buildTime?, commit? }
 */
const express = require('express');
const { broadcast } = require('../wsHub');
const router = express.Router();

router.get('/', (req, res) => {
  const version = process.env.APP_VERSION || '';
  const buildTime = process.env.BUILD_TIME || '';
  const commit = process.env.COMMIT_SHA || '';
  res.json({ version, buildTime, commit });
});

// POST /api/version/broadcast  body: { version?, buildTime?, commit? }
router.post('/broadcast', express.json(), (req, res) => {
  const token = req.headers['x-admin-token'] || '';
  const expected = process.env.VERSION_BROADCAST_TOKEN || '';
  if (!expected || token !== expected) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const body = req.body || {};
  const payload = {
    version: body.version || process.env.APP_VERSION || '',
    buildTime: body.buildTime || process.env.BUILD_TIME || '',
    commit: body.commit || process.env.COMMIT_SHA || ''
  };
  const ok = broadcast(payload);
  return res.json({ ok, sent: payload });
});

module.exports = router;

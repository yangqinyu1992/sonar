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

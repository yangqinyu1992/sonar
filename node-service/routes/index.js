/*
 * 根路由
 * GET /            —— 健康检查/欢迎信息
 */
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('Hello from Node.js service! Connected to MongoDB.');
});

module.exports = router;

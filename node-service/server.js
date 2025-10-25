/*
 * Node 服务主入口（Express + WebSocket）
 * 功能概述：
 * - 提供 REST 接口（/api/auth、/api/items、/api/version）
 * - 连接 MongoDB（MONGO_URI）
 * - 通过 WebSocket 向前端推送版本更新（/ws/version）
 * 关键环境变量：
 * - PORT：服务端口，默认 3000
 * - MONGO_URI：MongoDB 连接串
 * - APP_VERSION/BUILD_TIME/COMMIT_SHA：版本信息（用于 /api/version 与 WS 推送）
 */
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const { setBroadcaster } = require('./wsHub');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/testdb';

// Basic CORS for direct calls if needed (kept permissive)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

// Routes (modularized)
const indexRouter = require('./routes/index');
const itemsRouter = require('./routes/items');
const versionRouter = require('./routes/version');
const authRouter = require('./routes/auth');

app.use('/', indexRouter);
app.use('/api/items', itemsRouter);
app.use('/api/version', versionRouter);
app.use('/api/auth', authRouter);

// Create HTTP server to attach WebSocket
const server = http.createServer(app);

// WebSocket for version push
const APP_VERSION = process.env.APP_VERSION || '';
const BUILD_TIME = process.env.BUILD_TIME || '';
const COMMIT_SHA = process.env.COMMIT_SHA || '';

const wss = new WebSocketServer({ server, path: '/ws/version' });

function getVersionPayload(custom) {
  const data = custom || { version: APP_VERSION, buildTime: BUILD_TIME, commit: COMMIT_SHA };
  return JSON.stringify({ type: 'version', ...data });
}

wss.on('connection', (ws) => {
  try { ws.send(getVersionPayload()); } catch {}
  ws.on('message', () => {});
});

setBroadcaster((payload) => {
  const message = typeof payload === 'string' ? payload : getVersionPayload(payload);
  wss.clients.forEach((client) => {
    try { client.send(message); } catch {}
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

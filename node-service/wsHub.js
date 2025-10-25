/*
 * WebSocket 广播中枢
 * - setBroadcaster(fn)：注册广播实现
 * - broadcast(payload)：对所有已连接客户端广播
 */
let broadcaster = null;

function setBroadcaster(fn) {
  broadcaster = typeof fn === 'function' ? fn : null;
}

function broadcast(payload) {
  if (!broadcaster) return false;
  try {
    broadcaster(payload);
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = { setBroadcaster, broadcast };

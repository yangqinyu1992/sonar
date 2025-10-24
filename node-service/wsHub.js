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

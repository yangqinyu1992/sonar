<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { apiFetch } from './utils/api'

const updateAvailable = ref(false)
const currentVersion = ref(null)
let ws = null
let reconnectTimer = null

function connectWs() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const url = `${protocol}://${location.host}/ws/version`
  try {
    ws = new WebSocket(url)
    ws.onopen = () => {
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
    }
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data || '{}')
        if (data && data.type === 'version') {
          const v = String(data.version || '').trim()
          if (currentVersion.value === null) {
            currentVersion.value = v
          } else if (v && currentVersion.value && v !== currentVersion.value) {
            updateAvailable.value = true
          }
        }
      } catch {}
    }
    ws.onclose = () => {
      reconnectTimer = setTimeout(connectWs, 3000)
    }
    ws.onerror = () => {
      try { ws && ws.close() } catch {}
    }
  } catch (e) {
    reconnectTimer = setTimeout(connectWs, 3000)
  }
}

onMounted(() => {
  connectWs()
})

onUnmounted(() => {
  try { ws && ws.close() } catch {}
  if (reconnectTimer) clearTimeout(reconnectTimer)
})

function reloadPage() {
  window.location.reload()
}
</script>

<template>
  <div>
    <div v-if="updateAvailable" class="update-banner">
      检测到新版本，点击
      <button class="reload-btn" @click="reloadPage">刷新页面</button>
      获取最新内容。
    </div>

    <router-view />
  </div>
</template>

<style scoped>
.update-banner {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #fffbe6;
  color: #8d6b00;
  border: 1px solid #ffe58f;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.reload-btn {
  background: #1677ff;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 10px;
  cursor: pointer;
}
header {
  line-height: 1.5;
}
.logo {
  display: block;
  margin: 0 auto 2rem;
}
@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }
  .logo { margin: 0 2rem 0 0; }
  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>

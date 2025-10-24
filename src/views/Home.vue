<template>
  <div class="home">
    <div class="top-bar">
      <div class="brand">Demo Admin</div>
      <div class="actions">
        <span>{{ user?.username }}</span>
        <button @click="logout">退出</button>
      </div>
    </div>
    <div class="content">
      <h2>欢迎使用</h2>
      <p>这是登录后的首页。</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const user = ref(null)

onMounted(() => {
  try { user.value = JSON.parse(localStorage.getItem('currentUser') || '{}') } catch { user.value = {} }
})

function logout() {
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  localStorage.removeItem('currentUser')
  router.replace('/login')
}
</script>

<style scoped>
.top-bar { height: 56px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: #001529; color: #fff; }
.brand { font-weight: 600; }
.actions { display: flex; align-items: center; gap: 12px; }
.content { padding: 16px; }
</style>

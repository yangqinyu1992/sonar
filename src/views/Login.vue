<template>
  <div class="login-page">
    <div class="login-card">
      <div class="tabs">
        <button :class="{active: mode==='login'}" @click="mode='login'">登录</button>
        <button :class="{active: mode==='register'}" @click="mode='register'">注册</button>
      </div>
      <div class="title">{{ mode==='login' ? '系统登录' : '注册账号' }}</div>
      <form @submit.prevent="onSubmit">
        <div class="form-item">
          <label>用户名</label>
          <input v-model.trim="form.username" placeholder="输入用户名" />
        </div>
        <div class="form-item" v-if="mode==='register'">
          <label>昵称</label>
          <input v-model.trim="form.nickname" placeholder="输入昵称（可选）" />
        </div>
        <div class="form-item">
          <label>密码</label>
          <input v-model.trim="form.password" type="password" placeholder="输入密码" />
        </div>
        <div class="form-item remember" v-if="mode==='login'">
          <label><input type="checkbox" v-model="form.remember" /> 记住我</label>
        </div>
        <button class="submit-btn" :disabled="loading">{{ loading ? (mode==='login'?'登录中...':'注册中...') : (mode==='login'?'登录':'注册并登录') }}</button>
        <div class="error" v-if="errorMsg">{{ errorMsg }}</div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiFetch } from '@/utils/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const errorMsg = ref('')
const mode = ref('login')

const form = reactive({ username: '', password: '', nickname: '', remember: true })

async function onSubmit() {
  errorMsg.value = ''
  if (!form.username || !form.password) {
    errorMsg.value = '请输入用户名和密码'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'register') {
      // 注册
      const r = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, password: form.password, nickname: form.nickname })
      })
      if (!r.ok) {
        const t = await r.json().catch(() => ({}))
        throw new Error(t.message || '注册失败')
      }
    }
    // 登录
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: form.username, password: form.password })
    })
    if (!res.ok) {
      const t = await res.json().catch(() => ({}))
      throw new Error(t.message || '登录失败')
    }
    const data = await res.json()
    if (form.remember) {
      localStorage.setItem('token', data.token)
    } else {
      sessionStorage.setItem('token', data.token)
    }
    localStorage.setItem('currentUser', JSON.stringify(data.user || {}))
    const redirect = route.query.redirect || '/'
    router.replace(String(redirect))
  } catch (e) {
    errorMsg.value = e.message || (mode.value==='login'?'登录失败':'注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fa; }
.login-card { width: 360px; padding: 32px; background: #fff; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.title { font-size: 20px; font-weight: 600; margin-bottom: 16px; text-align: center; }
.tabs { display: flex; gap: 8px; margin-bottom: 12px; }
.tabs button { flex: 1; height: 36px; border: 1px solid #dcdfe6; background: #fafafa; cursor: pointer; border-radius: 4px; }
.tabs button.active { background: #1677ff; color: #fff; border-color: #1677ff; }
.form-item { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
.form-item input { height: 36px; padding: 0 10px; border: 1px solid #dcdfe6; border-radius: 4px; }
.remember { display: flex; align-items: center; }
.submit-btn { width: 100%; height: 36px; background: #1677ff; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-top: 8px; }
.error { color: #d4380d; margin-top: 10px; text-align: center; }
</style>

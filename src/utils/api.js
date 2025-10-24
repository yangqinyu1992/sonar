export function apiFetch(path, options = {}) {
  const base = import.meta.env.VITE_API_BASE || ''
  const url = base ? `${base}${path}` : path
  const headers = new Headers(options.headers || {})
  const token = localStorage.getItem('token') || sessionStorage.getItem('token')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  return fetch(url, { ...options, headers })
}

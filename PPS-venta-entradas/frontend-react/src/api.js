const API_BASE = '/api/v1'

let refreshPromise = null

async function rawFetch(path, { body, headers, ...options } = {}) {
  const finalHeaders = { ...(headers || {}) }
  if (body && !(body instanceof URLSearchParams)) {
    finalHeaders['Content-Type'] = 'application/json'
  }
  return fetch(`${API_BASE}${path}`, {
    credentials: 'same-origin',
    body,
    headers: finalHeaders,
    ...options,
  })
}

// fetch con cookies de sesión y refresco automático del access token.
// Si una request devuelve 401, intenta POST /auth/refresh una sola vez
// (compartido entre llamadas concurrentes) y reintenta la request original.
export async function apiFetch(path, options = {}) {
  let res = await rawFetch(path, options)

  if (res.status === 401 && !path.startsWith('/auth/')) {
    refreshPromise = refreshPromise || rawFetch('/auth/refresh', { method: 'POST' })
    try {
      const refreshed = await refreshPromise
      if (refreshed.ok) {
        res = await rawFetch(path, options)
      }
    } finally {
      refreshPromise = null
    }
  }

  return res
}

// Igual que apiFetch pero parsea JSON y lanza Error con el "detail" si falla
export async function apiJson(path, options) {
  const res = await apiFetch(path, options)
  let data = null
  try {
    data = await res.json()
  } catch {
    data = null
  }
  if (!res.ok) {
    const detail = data?.detail
    throw new Error(typeof detail === 'string' ? detail : `Error ${res.status}`)
  }
  return data
}

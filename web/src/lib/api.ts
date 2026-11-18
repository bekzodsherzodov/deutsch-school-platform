export class ApiError extends Error {
  status?: number
  net?: boolean
}

async function request<T>(method: 'GET' | 'POST', url: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    })
  } catch {
    const e = new ApiError('Serverga ulanib bo‘lmadi')
    e.net = true
    throw e
  }
  let json: any = null
  try { json = await res.json() } catch { /* bo‘sh javob */ }
  if (!res.ok) {
    const e = new ApiError(json?.error || `Xatolik ${res.status}`)
    e.status = res.status
    throw e
  }
  return (json ?? {}) as T
}

export const api = {
  get: <T,>(url: string) => request<T>('GET', url),
  post: <T,>(url: string, body?: unknown) => request<T>('POST', url, body ?? {}),
}

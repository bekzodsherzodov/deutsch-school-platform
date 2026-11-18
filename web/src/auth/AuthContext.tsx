import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import type { LoginResult, Session } from '../types'

interface AuthState {
  session: Session | null
  loading: boolean
  login: (user: string, password: string, remember: boolean) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Session>('/api/session')
      .then(setSession)
      .catch(() => setSession(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (user: string, password: string, remember: boolean) => {
    const r = await api.post<LoginResult>('/api/auth/login', { user, password, remember })
    setSession({ role: r.role, id: r.id })
  }, [])

  const logout = useCallback(async () => {
    await api.post('/api/auth/logout')
    setSession(null)
  }, [])

  return <Ctx.Provider value={{ session, loading, login, logout }}>{children}</Ctx.Provider>
}

export function useAuth(): AuthState {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth AuthProvider ichida ishlatilishi kerak')
  return v
}

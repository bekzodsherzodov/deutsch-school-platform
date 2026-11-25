import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'

export default function LoginPage() {
  const { login } = useAuth()
  const [user, setUser] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!user.trim() || !password) return setError('Login va parolni kiriting')
    setBusy(true)
    setError('')
    try {
      await login(user.trim(), password, remember)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Xatolik')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-violet-brand/15 blur-3xl" />

      <form onSubmit={onSubmit} noValidate className="card relative w-full max-w-md p-8 md:p-10">
        <img src="/logo.png" alt="Deutsch School" className="mx-auto mb-4 size-20 object-contain" />
        <h1 className="text-center text-3xl font-extrabold text-ink">Deutsch School</h1>
        <p className="mb-7 mt-2 text-center text-[15px] font-medium text-ink-soft">Kirish uchun login va parolni kiriting</p>

        <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="li-user">Login</label>
        <input id="li-user" className="field" value={user} onChange={(e) => setUser(e.target.value)}
          autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false} />

        <label className="mb-1.5 mt-4 block text-sm font-semibold text-ink" htmlFor="li-pw">Parol</label>
        <input id="li-pw" type="password" className="field" value={password}
          onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />

        <label className="mt-4 flex items-center gap-2.5 text-sm font-medium text-ink-soft">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-brand-600" />
          Bu qurilmada eslab qol
        </label>

        {error && <div role="alert" className="mt-4 rounded-2xl bg-rose-soft px-4 py-3 text-sm font-medium text-rose-brand">{error}</div>}

        <button disabled={busy} type="submit" className="btn-primary mt-6 w-full py-3.5 text-base">
          {busy ? 'Kirilmoqda…' : <>Kirish <Icon name="arrowRight" className="size-5" /></>}
        </button>
      </form>
    </div>
  )
}

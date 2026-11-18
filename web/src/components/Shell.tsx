import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../auth/AuthContext'
import Icon, { type IconName } from './Icon'

export interface NavItem { key: string; label: string; icon: IconName; group: string; element: ReactNode; badge?: number }

const NavCtx = createContext<(key: string) => void>(() => {})
export const useGo = () => useContext(NavCtx)

const ROLE_LABEL = { admin: 'Administrator', teacher: 'O‘qituvchi', student: 'O‘quvchi', parent: 'Ota-ona' } as const

function Logo() {
  return (
    <div className="flex items-center gap-3 px-2">
      <img src="/logo.png" alt="" className="size-12 rounded-xl object-contain" />
      <span className="text-xl font-extrabold leading-5 text-ink">Deutsch<br />School</span>
    </div>
  )
}

function NavList({ items, active, onPick }: { items: NavItem[]; active?: string; onPick: (k: string) => void }) {
  const groups = [...new Set(items.map((i) => i.group))]
  return (
    <nav className="mt-6 flex flex-col gap-5">
      {groups.map((g) => (
        <div key={g}>
          <div className="mb-2 px-3 text-base font-semibold text-ink-soft">{g}</div>
          <div className="flex flex-col gap-1">
            {items.filter((i) => i.group === g).map((i) => {
              const on = i.key === active
              return (
                <button key={i.key} onClick={() => onPick(i.key)} aria-current={on ? 'page' : undefined}
                  className={'flex items-center gap-3.5 rounded-2xl px-4 py-3 text-left text-base font-semibold transition ' +
                    (on ? 'bg-gradient-to-b from-brand-500 to-brand-700 text-white shadow-btn' : 'text-ink hover:bg-white/70')}>
                  <Icon name={i.icon} className="size-6 shrink-0" stroke={1.7} />
                  <span className="flex-1">{i.label}</span>
                  {!!i.badge && <span className="grid min-w-5 place-items-center rounded-full bg-rose-brand px-1.5 text-xs font-bold text-white">{i.badge}</span>}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}

function Sidebar({ items, active, onPick }: { items: NavItem[]; active?: string; onPick: (k: string) => void }) {
  return (
    <div className="flex h-full flex-col">
      <Logo />
      <div className="thin-scroll -mr-2 flex-1 overflow-y-auto pr-2"><NavList items={items} active={active} onPick={onPick} /></div>
      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white/70 p-3">
        <div className="grid size-11 place-items-center rounded-xl bg-brand-100 text-brand-600"><Icon name="check" className="size-6" /></div>
        <div className="text-sm leading-tight"><b className="block text-ink">Deutsch School</b><span className="text-ink-soft">v1.0</span></div>
      </div>
    </div>
  )
}

export default function Shell({ items, unread = 0 }: { items: NavItem[]; unread?: number }) {
  const { logout, session } = useAuth()
  const [active, setActive] = useState(items[0]?.key)
  const [drawer, setDrawer] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const current = items.find((i) => i.key === active)
  const role = session ? ROLE_LABEL[session.role] : ''
  const name = session?.role === 'admin' ? 'Administrator' : session?.id ?? ''
  const go = (k: string) => { setActive(k); setDrawer(false); window.scrollTo({ top: 0 }) }

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <NavCtx.Provider value={go}>
      <div className="min-h-dvh md:pl-72 lg:pl-80">
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 lg:w-80 border-r border-white/70 bg-gradient-to-b from-brand-100/80 to-white/60 p-5 backdrop-blur-xl md:block">
          <Sidebar items={items} active={active} onPick={go} />
        </aside>

        {drawer && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-ink/40" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-gradient-to-b from-brand-100 to-white p-5 shadow-2xl">
              <Sidebar items={items} active={active} onPick={go} />
            </aside>
          </div>
        )}

        <div className="mx-auto max-w-[1680px] px-4 pb-8 pt-4 md:px-8 lg:px-10">
          <header className="mb-6 flex items-center gap-3">
            <button onClick={() => setDrawer(true)} className="card grid size-12 shrink-0 place-items-center md:hidden" aria-label="Menyu">
              <Icon name="menu" className="size-6" />
            </button>
            <label className="card relative hidden max-w-xl flex-1 items-center rounded-full px-5 py-3.5 sm:flex">
              <Icon name="search" className="size-5 text-brand-600" />
              <input placeholder="Qidiruv…" className="ml-3 w-full bg-transparent text-base outline-none placeholder:text-ink-soft" />
              <kbd className="rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-semibold text-ink-soft">⌘ K</kbd>
            </label>
            <div className="flex-1 sm:hidden" />
            <div className="ml-auto flex items-center gap-3">
              <button className="card relative grid size-12 place-items-center rounded-full" aria-label="Yangiliklar"
                onClick={() => { const n = items.find((i) => i.label === 'Yangiliklar'); if (n) go(n.key) }}>
                <Icon name="bell" className="size-6" />
                {unread > 0 && <span className="absolute right-2.5 top-2.5 size-3 rounded-full bg-rose-brand ring-2 ring-white" />}
              </button>
              <div className="relative" ref={menuRef}>
                <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-3 rounded-full py-1 pl-1 pr-2 transition hover:bg-white/60">
                  <span className="grid size-12 place-items-center rounded-full bg-ink text-lg font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                  <span className="hidden text-left leading-tight sm:block">
                    <b className="block text-base">{name}</b><span className="text-sm text-ink-soft">{role}</span>
                  </span>
                  <Icon name="chevDown" className="hidden size-5 text-brand-600 sm:block" />
                </button>
                {menu && (
                  <div className="card absolute right-0 top-full z-20 mt-2 w-52 p-2">
                    <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-brand hover:bg-rose-soft">
                      <Icon name="logout" className="size-5" /> Chiqish
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
          <main className="min-w-0">{current?.element}</main>
        </div>
      </div>
    </NavCtx.Provider>
  )
}

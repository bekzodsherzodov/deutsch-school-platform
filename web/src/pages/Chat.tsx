import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import Icon from '../components/Icon'
import { api } from '../lib/api'

export type Room = 'staff' | 'parents'
type RoleKey = 'admin' | 'teacher' | 'parent'

interface Member {
  id: string; name: string; role: RoleKey; sub: string; me: boolean; canDM: boolean; unread: number
  last: { text: string; ts: number; mine: boolean } | null
}
interface Msg { id: string; ts: number; text: string; x: boolean; me: boolean; name?: string; role?: string; ver: number }

const ROLE_LABEL: Record<RoleKey, string> = { admin: 'Administrator', teacher: 'O‘qituvchi', parent: 'Ota-ona' }
const ROLE_TONE: Record<string, string> = { admin: 'text-brand-600', teacher: 'text-violet-brand', parent: 'text-mint-brand' }
const AV = ['#2f66f0', '#7c5cf0', '#12b981', '#f59e0b', '#ef4458', '#0ea5e9', '#d946ef', '#14b8a6']

function initials(name: string) {
  const w = name.replace(/ ota-onasi$/, '').trim().split(/\s+/)
  return ((w[0]?.[0] ?? '') + (w[1]?.[0] ?? '')).toUpperCase() || '?'
}
function colorOf(s: string) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return AV[h % AV.length] }
const hhmm = (ts: number) => new Date(ts).toLocaleTimeString('uz', { hour: '2-digit', minute: '2-digit', hour12: false })
function dayLabel(ts: number) {
  const d = new Date(ts), n = new Date()
  if (d.toDateString() === n.toDateString()) return 'Bugun'
  const y = new Date(n.getTime() - 864e5)
  return d.toDateString() === y.toDateString() ? 'Kecha' : d.toLocaleDateString('ru-RU')
}

function Avatar({ name, id, size = 'size-12', text = 'text-base' }: { name: string; id: string; size?: string; text?: string }) {
  return (
    <span className={`grid ${size} shrink-0 place-items-center rounded-full font-bold text-white ${text}`}
      style={{ background: `linear-gradient(135deg, ${colorOf(id)}, ${colorOf(id + 'x')})` }}>{initials(name)}</span>
  )
}

/** Xabarlarni har 4 soniyada yangilab turadigan hook */
function useThread(path: string, query: string, norm: (m: any) => Msg) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [meta, setMeta] = useState<any>({})
  const last = useRef(0)
  const normRef = useRef(norm); normRef.current = norm
  const load = useCallback(async () => {
    if (!path) return
    try {
      const r = await api.get<any>(`${path}?${query}${query ? '&' : ''}since=${last.current}`)
      last.current = r.last ?? last.current
      setMeta(r)
      if (r.msgs?.length) {
        setMsgs((prev) => {
          const m = new Map(prev.map((x) => [x.id, x]))
          for (const x of r.msgs) m.set(x.id, normRef.current(x))
          return [...m.values()].sort((a, b) => a.ts - b.ts)
        })
      }
    } catch { /* tarmoq xatosi: keyingi urinishda */ }
  }, [path, query])
  useEffect(() => {
    setMsgs([]); last.current = 0
    load()
    const t = setInterval(load, 4000)
    return () => clearInterval(t)
  }, [load])
  return { msgs, meta, reload: load }
}

function Bubbles({ msgs, showNames, canDelete, onDelete }: {
  msgs: Msg[]; showNames: boolean; canDelete: (m: Msg) => boolean; onDelete: (m: Msg) => void
}) {
  const end = useRef<HTMLDivElement>(null)
  const count = msgs.length
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }) }, [count])
  if (!msgs.length) return <div className="grid flex-1 place-items-center p-6 text-center font-medium text-ink-soft">Hali xabar yo‘q. Birinchi bo‘lib yozing.</div>
  let prevDay = ''
  return (
    <div className="thin-scroll flex-1 overflow-y-auto px-4 py-4">
      {msgs.map((m) => {
        const day = dayLabel(m.ts)
        const sep = day !== prevDay; prevDay = day
        return (
          <div key={m.id}>
            {sep && <div className="my-3 text-center"><span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-ink-soft">{day}</span></div>}
            <div className={`group mb-2 flex items-end gap-2 ${m.me ? 'justify-end' : ''}`}>
              {!m.me && showNames && <Avatar name={m.name ?? '?'} id={m.name ?? '?'} size="size-8" text="text-xs" />}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-card ${m.me ? 'rounded-br-md bg-gradient-to-b from-brand-500 to-brand-700 text-white' : 'rounded-bl-md bg-white text-ink'}`}>
                {!m.me && showNames && m.name && (
                  <div className={`text-xs font-bold ${ROLE_TONE[m.role ?? ''] ?? 'text-brand-600'}`}>
                    {m.name}{m.role === 'admin' && <span className="ml-1.5 font-semibold text-ink-soft">admin</span>}
                  </div>
                )}
                {m.x
                  ? <div className={`text-sm italic ${m.me ? 'text-white/80' : 'text-ink-soft'}`}>Xabar o‘chirildi</div>
                  : <div className="whitespace-pre-wrap break-words text-[15px]">{m.text}</div>}
                <div className={`mt-0.5 flex items-center justify-end gap-2 text-[11px] ${m.me ? 'text-white/75' : 'text-ink-soft'}`}>
                  {!m.x && canDelete(m) && (
                    <button onClick={() => onDelete(m)} aria-label="O‘chirish" className="opacity-60 transition hover:opacity-100">
                      <Icon name="trash" className="size-3.5" />
                    </button>
                  )}
                  {hhmm(m.ts)}
                </div>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={end} />
    </div>
  )
}

function Composer({ onSend, disabled, note }: { onSend: (t: string) => Promise<void>; disabled?: boolean; note?: string }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function submit(e: FormEvent) {
    e.preventDefault()
    const t = text.trim()
    if (!t || busy || disabled) return
    setBusy(true); setErr('')
    try { await onSend(t); setText('') } catch (x) { setErr(x instanceof Error ? x.message : 'Xatolik') } finally { setBusy(false) }
  }
  if (disabled) return <div className="border-t border-brand-100/70 px-4 py-4 text-center text-sm font-semibold text-ink-soft">{note}</div>
  return (
    <form onSubmit={submit} className="border-t border-brand-100/70 p-3">
      {err && <div role="alert" className="mb-2 px-2 text-sm font-medium text-rose-brand">{err}</div>}
      <div className="flex items-center gap-2">
        <input className="field !rounded-full" placeholder="Xabar yozing…" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)} />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Yuborish" className="btn-primary !size-12 shrink-0 !p-0"><Icon name="send" className="size-5" /></button>
      </div>
    </form>
  )
}

/* ---------------- ishtirokchilar paneli (Telegram “Участники” kabi) ---------------- */

function MembersPanel({ members, onOpen, onClose, showClose, title }: {
  members: Member[]; onOpen: (m: Member) => void; onClose: () => void; showClose: boolean; title: string
}) {
  const [q, setQ] = useState('')
  const [tab, setTab] = useState<'all' | 'dm'>('all')
  const totalUnread = members.reduce((s, m) => s + m.unread, 0)
  const list = useMemo(() => {
    const k = q.trim().toLowerCase()
    let l = members.filter((m) => !k || m.name.toLowerCase().includes(k) || m.sub.toLowerCase().includes(k))
    if (tab === 'dm') l = l.filter((m) => m.last).sort((a, b) => (b.last?.ts ?? 0) - (a.last?.ts ?? 0))
    return l
  }, [members, q, tab])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between px-5 pb-3 pt-5">
        <h2 className="text-lg font-extrabold">{title} <span className="font-semibold text-ink-soft">{members.length}</span></h2>
        {showClose && <button onClick={onClose} aria-label="Yopish" className="grid size-9 place-items-center rounded-full hover:bg-brand-50"><Icon name="close" className="size-5" /></button>}
      </div>
      <div className="px-4">
        <label className="flex items-center gap-2 rounded-full bg-brand-50 px-4 py-2.5">
          <Icon name="search" className="size-5 text-brand-600" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism bo‘yicha qidirish" className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-soft" />
        </label>
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-brand-50 p-1 text-sm font-bold">
          {([['all', 'Hammasi'], ['dm', 'Yozishmalar']] as const).map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} className={'relative rounded-full py-2 transition ' + (tab === k ? 'bg-white text-brand-600 shadow-card' : 'text-ink-soft')}>
              {l}{k === 'dm' && totalUnread > 0 && <span className="ml-1.5 rounded-full bg-rose-brand px-1.5 py-0.5 text-[11px] text-white">{totalUnread}</span>}
            </button>
          ))}
        </div>
      </div>
      <ul className="thin-scroll mt-2 flex-1 overflow-y-auto px-2 pb-3">
        {list.length === 0 && <li className="px-4 py-8 text-center text-sm font-medium text-ink-soft">{tab === 'dm' ? 'Hali shaxsiy yozishma yo‘q' : 'Hech kim topilmadi'}</li>}
        {list.map((m) => (
          <li key={m.id}>
            <button onClick={() => m.canDM && onOpen(m)} disabled={!m.canDM}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition enabled:hover:bg-brand-50 disabled:cursor-default">
              <Avatar name={m.name} id={m.id} />
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[15px]">{m.name}{m.me && <span className="ml-1 font-semibold text-ink-soft">(siz)</span>}</b>
                <span className="block truncate text-sm text-ink-soft">
                  {m.last ? `${m.last.mine ? 'Siz: ' : ''}${m.last.text}` : m.role === 'parent' ? (m.sub ? `Ota-ona · ${m.sub}` : 'Ota-ona') : ROLE_LABEL[m.role]}
                </span>
              </span>
              {m.unread > 0
                ? <span className="grid min-w-6 place-items-center rounded-full bg-brand-600 px-1.5 py-0.5 text-xs font-bold text-white">{m.unread}</span>
                : m.canDM && <span className="text-xs font-bold text-brand-600">Yozish</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* ---------------- asosiy chat ---------------- */

export default function ChatRoom({ room }: { room: Room }) {
  const { session } = useAuth()
  const myId = session?.id ?? ''
  const isAdmin = session?.role === 'admin'
  const [peer, setPeer] = useState<Member | null>(null)
  const [panel, setPanel] = useState(false) // telefonda ishtirokchilar oynasi
  const [members, setMembers] = useState<Member[]>([])

  const title = room === 'staff' ? 'O‘qituvchilar chati' : 'Ota-onalar chati'
  const loadMembers = useCallback(async () => {
    try { setMembers((await api.get<{ members: Member[] }>(`/api/dm/members?room=${room}`)).members) } catch { /* keyingi urinish */ }
  }, [room])
  useEffect(() => { loadMembers(); const t = setInterval(loadMembers, 8000); return () => clearInterval(t) }, [loadMembers])
  useEffect(() => { setPeer(null) }, [room])

  // guruh xabarlari
  const groupPath = room === 'staff' ? '/api/chat' : '/api/pchat'
  const group = useThread(groupPath, peer ? 'peek=1' : '', (m) => ({
    id: m.id, ts: m.ts, text: m.text ?? '', x: !!m.x, ver: m.ver ?? 0, name: m.name, role: m.role,
    me: room === 'staff' ? m.uid === myId : !!m.me,
  }))
  // shaxsiy xabarlar
  const dm = useThread(peer ? '/api/dm' : '', peer ? `peer=${encodeURIComponent(peer.id)}` : '', (m) => ({ id: m.id, ts: m.ts, text: m.text, x: !!m.x, me: !!m.me, ver: m.ver }))

  const locked = room === 'parents' && group.meta.enabled === false
  const current = peer ? { msgs: dm.msgs, reload: dm.reload } : { msgs: group.msgs, reload: group.reload }

  async function send(text: string) {
    if (peer) await api.post('/api/dm', { peer: peer.id, text })
    else await api.post(groupPath, { text })
    await current.reload(); loadMembers()
  }
  async function del(m: Msg) {
    if (peer) await api.post('/api/dm/delete', { id: m.id })
    else await api.post(room === 'staff' ? '/api/chat/delete' : '/api/pchat/delete', { id: m.id })
    await current.reload()
  }
  async function toggleLock() { await api.post('/api/pchat/lock', { locked: !locked }); await group.reload() }
  const open = (m: Member) => { setPeer(m); setPanel(false) }

  const peerFresh = peer ? members.find((m) => m.id === peer.id) ?? peer : null
  const panelTitle = room === 'parents' && !isAdmin ? 'Administrator' : 'Ishtirokchilar'
  const sub = room === 'parents' && !isAdmin ? 'Ota-onalar va administrator' : `${members.length} ishtirokchi`

  return (
    <div className="grid h-[calc(100dvh-130px)] min-h-[480px] gap-5 lg:grid-cols-[1fr_340px]">
      <section className="card flex min-h-0 flex-col overflow-hidden !p-0">
        {/* sarlavha */}
        <header className="flex items-center gap-3 border-b border-brand-100/70 px-4 py-3">
          {peerFresh ? (<>
            <button onClick={() => setPeer(null)} aria-label="Guruhga qaytish" className="grid size-10 place-items-center rounded-full hover:bg-brand-50"><Icon name="back" className="size-5" /></button>
            <Avatar name={peerFresh.name} id={peerFresh.id} size="size-11" />
            <div className="min-w-0 flex-1 leading-tight">
              <b className="block truncate">{peerFresh.name}</b>
              <span className={`text-sm font-semibold ${ROLE_TONE[peerFresh.role]}`}>{ROLE_LABEL[peerFresh.role]}{peerFresh.sub ? ` · ${peerFresh.sub}` : ''}</span>
            </div>
            <span className="hidden rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-ink-soft sm:inline">Shaxsiy yozishma</span>
          </>) : (<>
            <button onClick={() => setPanel(true)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-label="Ishtirokchilarni ochish">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-violet-brand text-white"><Icon name="users" className="size-6" /></span>
              <span className="min-w-0 leading-tight"><b className="block truncate text-lg">{title}</b><span className="text-sm font-medium text-ink-soft">{sub}</span></span>
            </button>
            {room === 'parents' && isAdmin && (
              <button onClick={toggleLock} className="btn-soft !px-3.5" title={locked ? 'Yozishni yoqish' : 'Yozishni to‘xtatish'}>
                <Icon name="lock" className="size-4" /><span className="hidden sm:inline">{locked ? 'Yozishni yoqish' : 'Yozishni to‘xtatish'}</span>
              </button>
            )}
            <button onClick={() => setPanel(true)} className="btn-soft lg:hidden !px-3.5" aria-label="Ishtirokchilar"><Icon name="users" className="size-4" />{members.length}</button>
          </>)}
        </header>

        <Bubbles msgs={current.msgs} showNames={!peer}
          canDelete={(m) => (peer ? m.me : isAdmin)} onDelete={del} />
        <Composer onSend={send} disabled={!peer && locked && !isAdmin} note="Administrator yozishni vaqtincha to‘xtatgan. Siz o‘qiy olasiz." />
      </section>

      {/* ishtirokchilar: katta ekranda doim ko‘rinadi, telefonda oyna */}
      <aside className="card hidden min-h-0 !p-0 lg:block">
        <MembersPanel members={members} onOpen={open} onClose={() => {}} showClose={false} title={panelTitle} />
      </aside>
      {panel && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setPanel(false)} />
          <div className="absolute inset-x-0 bottom-0 top-16 rounded-t-3xl bg-white shadow-2xl">
            <MembersPanel members={members} onOpen={open} onClose={() => setPanel(false)} showClose title={panelTitle} />
          </div>
        </div>
      )}
    </div>
  )
}

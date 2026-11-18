import { useEffect, useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { api } from './lib/api'
import ChatRoom from './pages/Chat'
import LoginPage from './pages/LoginPage'
import News from './pages/News'
import LegacyFrame from './components/LegacyFrame'
import StaffDashboard from './pages/StaffDashboard'
import { Attendance, FamilyHome, Grades, Payments, Results, Schedule } from './pages/FamilyPages'
import Shell, { type NavItem } from './components/Shell'
import type { IconName } from './components/Icon'
import type { Role } from './types'

type Def = [label: string, icon: IconName, group: string]

const GEN = 'Umumiy'
const EDU = 'Ta’lim'
const RES = 'Natijalar'
const FIN = 'Moliya'
const SYS = 'Tizim'

const NAV: Record<Role, Def[]> = {
  admin: [
    ['Boshqaruv paneli', 'home', GEN], ['Chat', 'chat', GEN], ['Ota-onalar chati', 'users', GEN], ['Yangiliklar', 'bell', GEN],
    ['Fanlar', 'book', EDU], ['Sinflar', 'sliders', EDU], ['O‘qituvchilar', 'cap', EDU], ['O‘quvchilar', 'users', EDU], ['Dars jadvali', 'calendar', EDU],
    ['Haftalik natijalar', 'clipboard', RES], ['Baho', 'star', RES], ['Reyting', 'trophy', RES],
    ['To‘lovlar', 'wallet', FIN], ['Davomat', 'check', FIN],
    ['Sozlamalar', 'user', SYS],
  ],
  teacher: [
    ['Boshqaruv paneli', 'home', GEN], ['Chat', 'chat', GEN],
    ['Sinflarim', 'sliders', EDU], ['Davomat', 'check', EDU], ['Dars jadvali', 'calendar', EDU],
    ['Haftalik natijalar', 'clipboard', RES], ['Baho', 'star', RES], ['Reyting', 'trophy', RES],
  ],
  student: [
    ['Boshqaruv paneli', 'home', GEN], ['Yangiliklar', 'bell', GEN],
    ['Dars jadvali', 'calendar', EDU], ['Baholar', 'star', EDU], ['Davomat', 'check', EDU],
    ['Natijalar', 'trend', RES], ['To‘lovlar', 'wallet', RES],
  ],
  parent: [
    ['Boshqaruv paneli', 'home', GEN], ['Chat', 'chat', GEN], ['Yangiliklar', 'bell', GEN],
    ['Dars jadvali', 'calendar', EDU], ['Baholar', 'star', EDU], ['Davomat', 'check', EDU],
    ['Natijalar', 'trend', RES], ['To‘lovlar', 'wallet', RES],
  ],
}

/** React menyusidagi nom → eski panel bo‘limi (to‘liq funksional shu yerda ishlaydi) */
const LEGACY: Record<string, string> = {
  'Yangiliklar': 'news', 'Fanlar': 'subjects', 'Sinflar': 'groups', 'O‘qituvchilar': 'teachers', 'O‘quvchilar': 'students',
  'Dars jadvali': 'schedule', 'Haftalik natijalar': 'weekly', 'Baho': 'grades', 'Reyting': 'ranking',
  'To‘lovlar': 'payments', 'Davomat': 'attendance', 'Sozlamalar': 'settings', 'Sinflarim': 'tmy',
}

function page(role: Role, label: string) {
  if (label === 'Chat') return role === 'parent' ? <ChatRoom room="parents" /> : <ChatRoom room="staff" />
  if (label === 'Ota-onalar chati') return <ChatRoom room="parents" />
  if (label === 'Boshqaruv paneli') return role === 'admin' || role === 'teacher' ? <StaffDashboard /> : <FamilyHome parent={role === 'parent'} />
  if (role === 'student' || role === 'parent') {
    if (label === 'Baholar') return <Grades />
    if (label === 'Davomat') return <Attendance />
    if (label === 'Dars jadvali') return <Schedule />
    if (label === 'To‘lovlar') return <Payments />
    if (label === 'Natijalar') return <Results />
  }
  if (label === 'Yangiliklar' && (role === 'student' || role === 'parent')) return <News />
  const key = LEGACY[label]
  return key ? <LegacyFrame page={key} title={label} /> : null
}

export default function App() {
  const { session, loading } = useAuth()
  const [dmUnread, setDm] = useState(0)
  const [gUnread, setG] = useState(0)
  const role = session?.role
  useEffect(() => {
    if (role !== 'admin' && role !== 'teacher' && role !== 'parent') return
    const tick = () => {
      api.get<{ unread: number }>('/api/dm/unread').then((r) => setDm(r.unread)).catch(() => {})
      if (role !== 'teacher') api.get<{ unread: number }>('/api/pchat/unread').then((r) => setG(r.unread)).catch(() => {})
    }
    tick()
    const t = setInterval(tick, 10000)
    return () => clearInterval(t)
  }, [role])
  if (loading) return <div className="grid min-h-dvh place-items-center font-semibold text-ink-soft">Yuklanmoqda…</div>
  if (!session) return <LoginPage />

  const items: NavItem[] = NAV[session.role].map(([label, icon, group]) => ({
    key: label, label, icon, group, element: page(session.role, label),
    badge: label === 'Chat' ? dmUnread + (session.role === 'parent' ? gUnread : 0) : label === 'Ota-onalar chati' ? gUnread : 0,
  }))
  return <Shell items={items} />
}

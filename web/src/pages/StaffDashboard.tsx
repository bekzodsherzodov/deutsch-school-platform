import { useAuth } from '../auth/AuthContext'
import { useGo } from '../components/Shell'
import { Card, EmptyState, Loading, PageHeader, Pill, QuickAction, StatCard, TrophyArt } from '../components/ui'
import Icon from '../components/Icon'
import { useFetch } from '../lib/useFetch'
import { todayCode } from '../lib/util'

type Rec = Record<string, any>
interface DataResp { data?: Rec }

/** Admin va o‘qituvchi uchun boshqaruv paneli (rasmdagi dizayn) */
export default function StaffDashboard() {
  const { session } = useAuth()
  const go = useGo()
  const { data: resp, loading } = useFetch<DataResp>('/api/data')
  const isAdmin = session?.role === 'admin'
  if (loading) return <Loading />

  const d: Rec = resp?.data ?? {}
  const groups: Rec[] = d.groups ?? []
  const students: Rec[] = d.students ?? []
  const subjects: Rec[] = d.subjects ?? []
  const timetable: Rec[] = d.timetable ?? []
  const today = todayCode()

  const myTT = isAdmin ? timetable : timetable.filter((t) => t.teacherId === session?.id)
  const myGroupIds = new Set(myTT.map((t) => t.groupId))
  const myGroups = isAdmin ? groups : groups.filter((g) => myGroupIds.has(g.id))
  const myStudents = isAdmin ? students : students.filter((s) => myGroupIds.has(s.groupId))
  const todayLessons = myTT.filter((t) => t.day === today)

  // eng so‘nggi haftalik natijalar bo‘yicha top o‘quvchilar
  const weekly: Rec = d.weekly ?? {}
  const myIds = new Set(myGroups.map((g) => g.id))
  let lastWeek = ''
  for (const k of Object.keys(weekly)) { const [g, , wk] = k.split('|'); if (myIds.has(g) && wk > lastWeek) lastWeek = wk }
  const score = new Map<string, { c: number; t: number }>()
  for (const [k, rec] of Object.entries<Rec>(weekly)) {
    const [g, , wk] = k.split('|')
    if (!myIds.has(g) || wk !== lastWeek) continue
    for (const [sid, r] of Object.entries<Rec>(rec ?? {})) {
      const t = Number(r?.total) || 0
      if (t <= 0) continue
      const o = score.get(sid) ?? { c: 0, t: 0 }
      o.c += Math.min(Number(r.correct) || 0, t); o.t += t
      score.set(sid, o)
    }
  }
  const top = [...score.entries()]
    .map(([sid, o]) => ({ s: students.find((x) => x.id === sid), pct: Math.round((o.c / o.t) * 100) }))
    .filter((x) => x.s).sort((a, b) => b.pct - a.pct).slice(0, 5)

  const name = isAdmin ? 'Administrator' : String(d.teachers?.find((t: Rec) => t.id === session?.id)?.name ?? 'O‘qituvchi')
  const key = (label: string) => () => go(label)

  return (
    <div className="relative isolate">
      <PageHeader title="Boshqaruv paneli" subtitle={`Xush kelibsiz, ${name}!`} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon="users" tone="blue" label="O‘quvchilar" value={myStudents.length} hint={`${myGroups.length} ta sinf`} />
        <StatCard icon="chart" tone="violet" label={isAdmin ? 'O‘qituvchilar' : 'Fanlar'}
          value={isAdmin ? (d.teachers ?? []).length : new Set(myTT.map((t) => t.subjectId)).size}
          hint={isAdmin ? `${subjects.length} ta fan` : 'mening fanlarim'} />
        <StatCard icon="calendar" tone="mint" label="Darslar" value={myTT.length} hint={`Bugun: ${todayLessons.length} ta`} hintIcon="clock" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
        <Card title="Reyting – top o‘quvchilar" icon="calendar" aside={<button onClick={key('Natijalar')} className="inline-flex items-center gap-1">Barchasi <Icon name="arrowRight" className="size-4" /></button>}>
          {top.length === 0 ? (
            <EmptyState art={<TrophyArt />} title="Hali natija yo‘q" text="Haftalik natijalar kiritilgach reyting shu yerda chiqadi."
              action={<button className="btn-primary" onClick={key('Natijalar')}><Icon name="check" className="size-5" /> Natija kiritish</button>} />
          ) : (
            <ol className="flex flex-col gap-2">
              {top.map((x, i) => (
                <li key={x.s!.id} className="flex items-center gap-3 rounded-2xl bg-brand-50/70 px-4 py-3">
                  <span className={`grid size-9 place-items-center rounded-full text-sm font-extrabold ${i === 0 ? 'bg-amber-soft text-amber-brand' : 'bg-white text-brand-600'}`}>{i + 1}</span>
                  <span className="flex-1 font-semibold">{x.s!.first} {x.s!.last}</span>
                  <Pill tone={x.pct >= 80 ? 'mint' : x.pct >= 50 ? 'blue' : 'amber'}>{x.pct}%</Pill>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="flex flex-col gap-5">
          <Card title="Sinflar" icon="bolt" aside={<span className="text-ink-soft">{myGroups.length} ta</span>}>
            {myGroups.length === 0 ? (
              <div className="card-flat"><EmptyState icon="cap" title="Hali sinf yo‘q." /></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myGroups.slice(0, 12).map((g) => <Pill key={g.id}>{g.name}</Pill>)}
              </div>
            )}
          </Card>

          <Card title="Tezkor amallar" icon="grid">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {isAdmin ? (<>
                <QuickAction icon="userPlus" label="O‘quvchi" onClick={key('O‘quvchilar')} />
                <QuickAction icon="sliders" label="Sinf" onClick={key('Sinflar')} />
                <QuickAction icon="check" label="Davomat" onClick={key('Natijalar')} />
                <QuickAction icon="wallet" label="To‘lov" onClick={key('To‘lovlar')} />
              </>) : (<>
                <QuickAction icon="sliders" label="Sinflarim" onClick={key('Sinflarim')} />
                <QuickAction icon="calendar" label="Jadval" onClick={key('Dars jadvali')} />
                <QuickAction icon="chart" label="Natija" onClick={key('Natijalar')} />
                <QuickAction icon="chat" label="Chat" onClick={key('Chat')} />
              </>)}
            </div>
          </Card>
        </div>
      </div>

      {!isAdmin && (
        <Card title="Bugungi darslarim" icon="clock" className="mt-5">
          {todayLessons.length === 0
            ? <EmptyState icon="calendar" title="Bugun dars yo‘q" text="Dam oling yoki ertangi darslarga tayyorlaning." />
            : <ul className="grid gap-2 sm:grid-cols-2">
                {todayLessons.map((t, i) => (
                  <li key={i} className="flex items-center gap-3 rounded-2xl bg-brand-50/70 px-4 py-3">
                    <Icon name="book" className="size-5 text-brand-600" />
                    <span className="font-semibold">{subjects.find((s) => s.id === t.subjectId)?.name ?? 'Fan'}</span>
                    <span className="ml-auto text-sm font-medium text-ink-soft">{groups.find((g) => g.id === t.groupId)?.name}</span>
                  </li>
                ))}
              </ul>}
        </Card>
      )}
      <img src="/building.webp" alt="" aria-hidden="true" draggable={false}
        className="pointer-events-none absolute -top-6 right-0 -z-10 hidden w-[44%] min-w-[420px] max-w-[720px] select-none md:block" />
    </div>
  )
}

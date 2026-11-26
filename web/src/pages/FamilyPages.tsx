import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react'
import { useGo } from '../components/Shell'
import Icon from '../components/Icon'
import { Card, EmptyState, Loading, PageHeader, Pill, QuickAction, StatCard, type Tone } from '../components/ui'
import { useFetch } from '../lib/useFetch'
import { DAY_NAMES, fmtDate, monthName, som, todayCode } from '../lib/util'

interface Me {
  first: string; last: string; group: string; fee: number; debt: number; thisMonth: string
  weekly: { week: string; subject: string; total: number; correct: number }[]
  grades: { date: string; subject: string; grade: number }[]
  attendance: { date: string; subject: string; code: string }[]
  sat: { date: string; subject: string; total: number; correct: number }[]
  labels: Record<string, string>
  schedule: {
    periods: { id: string; n: number; start: string; end: string; lunchSep: boolean }[]
    cells: { day: string; pid: string; subject: string; color: string; teacher: string }[]
  }
  payments: { mk: string; paid: boolean; date: string; method: string; amount: number }[]
}

const ATT: Record<string, { label: string; tone: Tone }> = {
  ok: { label: 'Keldi', tone: 'mint' },
  s: { label: 'Sababsiz', tone: 'rose' },
  dq: { label: 'Dars qoldirgan', tone: 'rose' },
  k: { label: 'Kech qolgan', tone: 'amber' },
}
const gradeTone = (g: number): Tone => (g >= 4 ? 'mint' : g >= 3 ? 'amber' : 'rose')

function useMe() {
  const r = useFetch<Me>('/api/me')
  return r
}

function Shellless({ title, subtitle, children, loading }: { title: string; subtitle?: string; children: ReactNode; loading: boolean }) {
  return <div><PageHeader title={title} subtitle={subtitle} />{loading ? <Loading /> : children}</div>
}

export function FamilyHome({ parent }: { parent: boolean }) {
  const { data: me, loading } = useMe()
  const go = useGo()
  const subtitle = me
    ? parent ? `Farzandingiz: ${me.first} ${me.last} · ${me.group || 'sinf belgilanmagan'}` : `Xush kelibsiz, ${me.first}!`
    : undefined
  return (
    <Shellless title="Boshqaruv paneli" subtitle={subtitle} loading={loading}>
      {me && <FamilyHomeBody me={me} go={go} />}
    </Shellless>
  )
}

function FamilyHomeBody({ me, go }: { me: Me; go: (k: string) => void }) {
  const avg = me.grades.length ? me.grades.reduce((s, g) => s + g.grade, 0) / me.grades.length : 0
  const came = me.attendance.filter((a) => a.code === 'ok').length
  const attPct = me.attendance.length ? Math.round((came / me.attendance.length) * 100) : 0
  const today = todayCode()
  const lessons = me.schedule.cells.filter((c) => c.day === today)
    .map((c) => ({ ...c, p: me.schedule.periods.find((p) => p.id === c.pid) }))
    .sort((a, b) => (a.p?.n ?? 0) - (b.p?.n ?? 0))

  return (<>
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard icon="star" tone="blue" label="O‘rtacha baho" value={avg ? avg.toFixed(1) : '0'} hint={`${me.grades.length} ta baho`} />
      <StatCard icon="check" tone="mint" label="Davomat" value={`${attPct}%`} hint={`${came} / ${me.attendance.length} dars`} />
      <StatCard icon="wallet" tone={me.debt > 0 ? 'rose' : 'violet'} label="To‘lov qarzi" value={me.debt > 0 ? som(me.debt).replace(' so‘m', '') : '0'}
        hint={me.debt > 0 ? 'so‘m qarz bor' : 'Qarz yo‘q'} hintIcon="clock" />
    </div>

    <div className="mt-5 grid gap-5 lg:grid-cols-[1.45fr_1fr]">
      <Card title="Bugungi darslar" icon="calendar" aside={<button onClick={() => go('Dars jadvali')} className="inline-flex items-center gap-1">Jadval <Icon name="arrowRight" className="size-4" /></button>}>
        {lessons.length === 0
          ? <EmptyState icon="calendar" title="Bugun dars yo‘q" text="Haftalik jadvalni “Dars jadvali” bo‘limida ko‘rishingiz mumkin." />
          : <ul className="flex flex-col gap-2">
              {lessons.map((l, i) => (
                <li key={i} className="flex items-center gap-4 rounded-2xl bg-brand-50/70 px-4 py-3">
                  <span className="grid size-10 place-items-center rounded-full bg-white text-sm font-extrabold text-brand-600">{l.p?.n ?? i + 1}</span>
                  <div className="min-w-0 flex-1"><b className="block">{l.subject}</b><span className="text-sm text-ink-soft">{l.teacher}</span></div>
                  <span className="text-sm font-semibold text-ink-soft">{l.p?.start}–{l.p?.end}</span>
                </li>
              ))}
            </ul>}
      </Card>

      <div className="flex flex-col gap-5">
        <Card title="So‘nggi baholar" icon="star" aside={<button onClick={() => go('Baholar')}>Barchasi</button>}>
          {me.grades.length === 0
            ? <EmptyState icon="star" title="Hali baho yo‘q" />
            : <ul className="flex flex-col gap-2">
                {me.grades.slice(0, 4).map((g, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Pill tone={gradeTone(g.grade)}>{g.grade}</Pill>
                    <span className="flex-1 font-semibold">{me.labels[g.subject] ?? g.subject}</span>
                    <span className="text-sm text-ink-soft">{fmtDate(g.date)}</span>
                  </li>
                ))}
              </ul>}
        </Card>
        <Card title="Tezkor amallar" icon="grid">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            <QuickAction icon="star" label="Baholar" onClick={() => go('Baholar')} />
            <QuickAction icon="check" label="Davomat" onClick={() => go('Davomat')} />
            <QuickAction icon="trend" label="Natijalar" onClick={() => go('Natijalar')} />
            <QuickAction icon="wallet" label="To‘lov" onClick={() => go('To‘lovlar')} />
          </div>
        </Card>
      </div>
    </div>
  </>)
}

function Table({ head, children }: { head: string[]; children: ReactNode }) {
  // Telefonda jadval o‘rniga "yorliq: qiymat" ko‘rinishidagi kartalar chiqadi — gorizontal surish kerak emas.
  const rows = Children.toArray(children).map((row) => {
    if (!isValidElement<{ children?: ReactNode }>(row)) return row
    let i = 0
    const cells = Children.map(row.props.children, (cell) =>
      isValidElement(cell) ? cloneElement(cell as ReactElement<Record<string, unknown>>, { 'data-label': head[i++] }) : cell)
    return cloneElement(row, undefined, cells)
  })
  return (
    <div className="thin-scroll sm:overflow-x-auto">
      <table className="w-full text-left text-[15px] sm:min-w-[420px] max-sm:block">
        <thead className="max-sm:hidden"><tr className="text-sm text-ink-soft">{head.map((h) => <th key={h} className="px-3 pb-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className={[
          '[&>tr]:border-t [&>tr]:border-brand-100/70 [&_td]:px-3 [&_td]:py-3',
          'max-sm:block max-sm:[&>tr]:block max-sm:[&>tr]:py-2.5 max-sm:[&>tr:first-child]:border-t-0',
          'max-sm:[&_td]:flex max-sm:[&_td]:items-center max-sm:[&_td]:justify-between max-sm:[&_td]:gap-4 max-sm:[&_td]:px-1 max-sm:[&_td]:py-1.5',
          'max-sm:[&_td]:before:content-[attr(data-label)] max-sm:[&_td]:before:text-sm max-sm:[&_td]:before:font-semibold max-sm:[&_td]:before:text-ink-soft',
        ].join(' ')}>{rows}</tbody>
      </table>
    </div>
  )
}

export function Grades() {
  const { data: me, loading } = useMe()
  return (
    <Shellless title="Baholar" subtitle="Fanlar bo‘yicha olingan baholar" loading={loading}>
      <Card>
        {!me || me.grades.length === 0 ? <EmptyState icon="star" title="Hali baho yo‘q" text="O‘qituvchi baho qo‘ygach shu yerda ko‘rinadi." /> : (
          <Table head={['Sana', 'Fan', 'Baho']}>
            {me.grades.map((g, i) => (
              <tr key={i}><td className="text-ink-soft">{fmtDate(g.date)}</td><td className="font-semibold">{me.labels[g.subject] ?? g.subject}</td><td><Pill tone={gradeTone(g.grade)}>{g.grade}</Pill></td></tr>
            ))}
          </Table>
        )}
      </Card>
    </Shellless>
  )
}

export function Attendance() {
  const { data: me, loading } = useMe()
  const cnt = (c: string) => me?.attendance.filter((a) => a.code === c).length ?? 0
  return (
    <Shellless title="Davomat" subtitle="Darslarga qatnashish tarixi" loading={loading}>
      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        {(['ok', 's', 'dq', 'k'] as const).map((c) => (
          <div key={c} className="card p-5"><div className="text-sm font-semibold text-ink-soft">{ATT[c].label}</div><div className="mt-1 text-4xl font-extrabold">{cnt(c)}</div></div>
        ))}
      </div>
      <Card>
        {!me || me.attendance.length === 0 ? <EmptyState icon="check" title="Davomat yozuvlari yo‘q" /> : (
          <Table head={['Sana', 'Fan', 'Holat']}>
            {me.attendance.map((a, i) => (
              <tr key={i}><td className="text-ink-soft">{fmtDate(a.date)}</td><td className="font-semibold">{a.subject ? me.labels[a.subject] ?? a.subject : '—'}</td>
                <td>{ATT[a.code] ? <Pill tone={ATT[a.code].tone}>{ATT[a.code].label}</Pill> : '—'}</td></tr>
            ))}
          </Table>
        )}
      </Card>
    </Shellless>
  )
}

export function Schedule() {
  const { data: me, loading } = useMe()
  const days = Object.keys(DAY_NAMES)
  return (
    <Shellless title="Dars jadvali" subtitle={me?.group ? `${me.group} sinfi` : undefined} loading={loading}>
      <Card>
        {!me || me.schedule.periods.length === 0 ? <EmptyState icon="calendar" title="Jadval hali tuzilmagan" /> : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-1.5 text-sm">
              <thead><tr><th className="w-20" />{days.map((d) => <th key={d} className={'rounded-xl py-2 font-bold ' + (d === todayCode() ? 'bg-brand-600 text-white' : 'text-ink-soft')}>{DAY_NAMES[d]}</th>)}</tr></thead>
              <tbody>
                {me.schedule.periods.map((p) => (
                  <tr key={p.id}>
                    <td className="pr-2 text-right align-middle text-xs font-semibold text-ink-soft">{p.n}-dars<br />{p.start}</td>
                    {days.map((d) => {
                      const c = me.schedule.cells.find((x) => x.day === d && x.pid === p.id)
                      return <td key={d} className={'h-14 rounded-xl px-2 text-center align-middle ' + (c ? 'bg-brand-50 font-semibold' : 'bg-white/50')}>
                        {c && <><span className="block">{c.subject}</span><span className="text-xs font-medium text-ink-soft">{c.teacher}</span></>}
                      </td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </Shellless>
  )
}

export function Payments() {
  const { data: me, loading } = useMe()
  return (
    <Shellless title="To‘lovlar" subtitle={me ? `Oylik to‘lov: ${som(me.fee)}` : undefined} loading={loading}>
      {me && me.debt > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-rose-soft px-5 py-4 font-semibold text-rose-brand">
          <Icon name="wallet" className="size-6" /> Umumiy qarz: {som(me.debt)}
        </div>
      )}
      <Card>
        {!me || me.payments.length === 0 ? <EmptyState icon="wallet" title="To‘lovlar yo‘q" /> : (
          <Table head={['Oy', 'Summa', 'Holat', 'Sana']}>
            {me.payments.map((p) => (
              <tr key={p.mk}><td className="font-semibold capitalize">{monthName(p.mk)}</td><td>{som(p.amount)}</td>
                <td><Pill tone={p.paid ? 'mint' : 'rose'}>{p.paid ? 'To‘langan' : 'To‘lanmagan'}</Pill></td><td className="text-ink-soft">{p.paid ? fmtDate(p.date) : '—'}</td></tr>
            ))}
          </Table>
        )}
      </Card>
    </Shellless>
  )
}

export function Results() {
  const { data: me, loading } = useMe()
  const rows = me ? [...me.weekly.map((w) => ({ date: w.week, subject: w.subject || 'Umumiy', total: w.total, correct: w.correct, kind: 'Haftalik' })),
    ...me.sat.map((s) => ({ date: s.date, subject: me.labels[s.subject] ?? s.subject, total: s.total, correct: s.correct, kind: 'Shanba' }))]
    .sort((a, b) => (a.date < b.date ? 1 : -1)) : []
  return (
    <Shellless title="Natijalar" subtitle="Haftalik va shanba imtihon natijalari" loading={loading}>
      <Card>
        {rows.length === 0 ? <EmptyState icon="trend" title="Hali natija yo‘q" text="Natijalar kiritilgach shu yerda chiqadi." /> : (
          <Table head={['Sana', 'Fan', 'Tur', 'Natija']}>
            {rows.map((r, i) => {
              const pct = Math.round((r.correct / r.total) * 100)
              return <tr key={i}><td className="text-ink-soft">{fmtDate(r.date)}</td><td className="font-semibold">{r.subject}</td><td>{r.kind}</td>
                <td><div className="flex items-center gap-3"><div className="h-2 w-24 overflow-hidden rounded-full bg-brand-100"><div className="h-full rounded-full bg-brand-600" style={{ width: pct + '%' }} /></div><b>{r.correct}/{r.total}</b></div></td></tr>
            })}
          </Table>
        )}
      </Card>
    </Shellless>
  )
}

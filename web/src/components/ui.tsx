import type { ReactNode } from 'react'
import Icon, { type IconName } from './Icon'

export type Tone = 'blue' | 'violet' | 'mint' | 'amber' | 'rose'

const TONE: Record<Tone, { box: string; text: string; line: string; stop: string }> = {
  blue:   { box: 'bg-brand-100 text-brand-600',        text: 'text-brand-600',        line: '#2f66f0', stop: '#2f66f0' },
  violet: { box: 'bg-violet-soft text-violet-brand',   text: 'text-violet-brand',     line: '#7c5cf0', stop: '#7c5cf0' },
  mint:   { box: 'bg-mint-soft text-mint-brand',       text: 'text-mint-brand',       line: '#12b981', stop: '#12b981' },
  amber:  { box: 'bg-amber-soft text-amber-brand',     text: 'text-amber-brand',      line: '#f59e0b', stop: '#f59e0b' },
  rose:   { box: 'bg-rose-soft text-rose-brand',       text: 'text-rose-brand',       line: '#ef4458', stop: '#ef4458' },
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink md:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-base font-medium text-ink-soft md:text-lg">{subtitle}</p>}
        <div className="mt-3 h-1 w-24 rounded-full bg-brand-600" />
      </div>
      {action}
    </div>
  )
}

export function Card({ title, icon, aside, children, className = '' }: {
  title?: string; icon?: IconName; aside?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`card p-5 md:p-6 ${className}`}>
      {title && (
        <header className="mb-4 flex items-center justify-between gap-3 border-b border-brand-100/70 pb-3">
          <h2 className="flex items-center gap-2.5 text-base font-bold text-ink">
            {icon && <Icon name={icon} className="size-5 text-brand-600" />}
            {title}
          </h2>
          {aside && <div className="text-sm font-semibold text-brand-600">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  )
}

export function StatCard({ icon, tone, label, value, hint, hintIcon = 'arrowUp' }: {
  icon: IconName; tone: Tone; label: string; value: ReactNode; hint?: string; hintIcon?: IconName
}) {
  const t = TONE[tone]
  const id = `g-${tone}`
  return (
    <div className="card relative overflow-hidden p-5">
      <div className="relative z-10 flex items-center gap-4">
        <div className={`grid size-16 shrink-0 place-items-center rounded-2xl ${t.box}`}>
          <Icon name={icon} className="size-8" stroke={1.7} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-ink">{label}</div>
          <div className="text-4xl font-extrabold leading-tight text-ink">{value}</div>
          {hint && (
            <div className={`mt-0.5 flex items-center gap-1.5 text-sm font-medium ${t.text}`}>
              <Icon name={hintIcon} className="size-4" stroke={2.2} />
              <span className="text-ink-soft">{hint}</span>
            </div>
          )}
        </div>
      </div>
      <svg viewBox="0 0 160 60" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 right-0 h-16 w-40 opacity-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={t.stop} stopOpacity=".22" />
            <stop offset="1" stopColor={t.stop} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0 52C20 52 30 36 52 38s34 14 54-4 34-26 54-26V60H0Z" fill={`url(#${id})`} />
        <path d="M0 52C20 52 30 36 52 38s34 14 54-4 34-26 54-26" fill="none" stroke={t.line} strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export function TrophyArt() {
  return (
    <svg viewBox="0 0 200 150" className="mx-auto h-36 w-48" aria-hidden="true">
      <defs>
        <linearGradient id="tr" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4d86ff" /><stop offset="1" stopColor="#0b3bd1" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="128" rx="84" ry="16" fill="#dbe7ff" opacity=".7" />
      <path d="M66 22h68v38a34 34 0 0 1-68 0z" fill="url(#tr)" />
      <path d="M66 32H46c0 22 8 34 24 38M134 32h20c0 22-8 34-24 38" fill="none" stroke="#2f66f0" strokeWidth="7" strokeLinecap="round" />
      <path d="M100 94v18M78 120h44l-6-10H84z" fill="#1f4fe0" />
      <path d="m100 36 5.8 11.8 13 1.9-9.4 9.2 2.2 13L100 65l-11.6 6.1 2.2-13-9.4-9.2 13-1.9z" fill="#fff" />
      <path d="M40 40l3 6 6 3-6 3-3 6-3-6-6-3 6-3zM160 28l2.4 4.8 4.8 2.4-4.8 2.4-2.4 4.8-2.4-4.8-4.8-2.4 4.8-2.4z" fill="#4d86ff" />
    </svg>
  )
}

export function EmptyState({ icon = 'cap', title, text, action, art }: {
  icon?: IconName; title: string; text?: string; action?: ReactNode; art?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-4 py-8 text-center">
      {art ?? (
        <div className="mb-3 grid size-16 place-items-center rounded-2xl bg-brand-100 text-brand-600">
          <Icon name={icon} className="size-8" stroke={1.6} />
        </div>
      )}
      <h3 className="text-xl font-extrabold text-ink">{title}</h3>
      {text && <p className="mt-1.5 max-w-sm text-[15px] font-medium text-ink-soft">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Pill({ tone = 'blue', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${TONE[tone].box}`}>{children}</span>
}

export function QuickAction({ icon, label, onClick }: { icon: IconName; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-2xl bg-white px-2 py-4 text-sm font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:bg-brand-50">
      <Icon name={icon} className="size-6 text-brand-600" />
      {label}
    </button>
  )
}

export function Loading() {
  return (
    <div className="grid gap-4">
      <div className="card h-28 animate-pulse" /><div className="card h-64 animate-pulse" />
    </div>
  )
}

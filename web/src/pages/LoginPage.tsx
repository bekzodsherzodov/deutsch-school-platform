import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Eski to‘liq boshqaruv paneli shu qobiq ichida (iframe) ochiladi.
 * Iframe ichidagi panel o‘zi tayyor bo‘lganda ({ds:'ready'}) xabar yuboradi —
 * shundan keyingina yuklanish pardasi yopiladi va bo‘lim almashtiriladi.
 */
export default function LegacyFrame({ page, title }: { page: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const want = useRef(page)
  const initial = useRef(page)
  const ready = useRef(false)
  const fallback = useRef<number>(0)
  const [loading, setLoading] = useState(true)
  const [slow, setSlow] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const apply = useCallback(() => {
    try {
      const w = ref.current?.contentWindow
      if (w && w.location.hash !== '#' + want.current) w.location.hash = want.current
    } catch { /* iframe hali tayyor emas */ }
  }, [])

  const markReady = useCallback(() => {
    window.clearTimeout(fallback.current)
    ready.current = true
    apply()
    setLoading(false)
    setSlow(false)
  }, [apply])

  // Bo‘lim almashganda: iframe tayyor bo‘lsa — hash'ni almashtiramiz, bo‘lmasa tayyor bo‘lganda qo‘llanadi.
  useEffect(() => {
    want.current = page
    if (ready.current) apply()
  }, [page, apply])

  // Iframe ichidagi paneldan "tayyor" xabari.
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.source !== ref.current?.contentWindow) return
      if (e.data && e.data.ds === 'ready') markReady()
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [markReady])

  // Sekin yuklansa — izoh va "Qayta yuklash" tugmasi.
  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setSlow(true), 7000)
    return () => window.clearTimeout(timer)
  }, [loading, attempt])

  useEffect(() => () => window.clearTimeout(fallback.current), [])

  const reload = () => {
    initial.current = want.current
    ready.current = false
    setSlow(false)
    setLoading(true)
    setAttempt((a) => a + 1)
  }

  return (
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-3xl">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-3xl border border-white/80 bg-white/90 p-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
            <p className="font-semibold text-ink">{slow ? 'Sahifa odatdagidan uzoq yuklanyapti…' : 'Sahifa yuklanmoqda…'}</p>
            {slow && (
              <>
                <p className="mt-1 text-sm text-ink-soft">Internet aloqasi yoki server sekin javob berayotgan bo‘lishi mumkin.</p>
                <button onClick={reload} className="mt-4 rounded-2xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white">Qayta yuklash</button>
              </>
            )}
          </div>
        </div>
      )}
      <iframe
        key={attempt}
        ref={ref}
        title={title}
        src={`/legacy.html?embed=1#${initial.current}`}
        onLoad={() => {
          // Eski (keshlangan) panel "tayyor" xabarini yubormasa — 6 soniyadan keyin pardani baribir yopamiz.
          window.clearTimeout(fallback.current)
          if (!ready.current) fallback.current = window.setTimeout(markReady, 6000)
        }}
        className="block w-full rounded-3xl border-0 bg-transparent"
        style={{ height: 'calc(100dvh - 8.5rem)', minHeight: 520 }}
      />
    </div>
  )
}

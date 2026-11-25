import { useEffect, useRef, useState } from 'react'

/** Eski to‘liq boshqaruv paneli (barcha funksiyalar) shu qobiq ichida ochiladi. */
export default function LegacyFrame({ page, title }: { page: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const [slow, setSlow] = useState(false)

  useEffect(() => {
    // Bir xil iframe ichida bo‘limni almashtirish — qayta yuklamasdan.
    try {
      const w = ref.current?.contentWindow
      if (w && w.location.hash !== '#' + page) {
        setLoading(true)
        setSlow(false)
        w.location.hash = page
        // Hash almashganda iframe'ning load hodisasi qayta ishlamaydi.
        const timer = window.setTimeout(() => setLoading(false), 900)
        return () => window.clearTimeout(timer)
      }
    } catch { /* iframe hali yuklanmagan */ }
  }, [page])

  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setSlow(true), 7000)
    return () => window.clearTimeout(timer)
  }, [loading])

  return (
    <div className="relative min-h-[520px] w-full overflow-hidden rounded-3xl">
      {loading && (
        <div className="absolute inset-0 z-10 grid place-items-center rounded-3xl border border-white/80 bg-white/90 p-6 text-center backdrop-blur-sm">
          <div>
            <div className="mx-auto mb-3 size-9 animate-spin rounded-full border-[3px] border-brand-100 border-t-brand-600" />
            <p className="font-semibold text-ink">{slow ? 'Sahifa odatdagidan uzoq yuklanyapti…' : 'Sahifa yuklanmoqda…'}</p>
            {slow && <p className="mt-1 text-sm text-ink-soft">Internet aloqasi yoki server sekin javob berayotgan bo‘lishi mumkin.</p>}
          </div>
        </div>
      )}
      <iframe
        ref={ref}
        title={title}
        src={`/legacy.html?embed=1#${page}`}
        onLoad={() => { setLoading(false); setSlow(false) }}
        onError={() => { setLoading(false); setSlow(false) }}
        className="block w-full rounded-3xl border-0 bg-transparent"
        style={{ height: 'calc(100dvh - 8.5rem)', minHeight: 520 }}
      />
    </div>
  )
}

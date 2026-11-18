import { useEffect, useRef } from 'react'

/** Eski to‘liq boshqaruv paneli (barcha funksiyalar) shu qobiq ichida ochiladi. */
export default function LegacyFrame({ page, title }: { page: string; title: string }) {
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    // bir xil iframe ichida bo‘limni almashtirish (qayta yuklamasdan)
    try {
      const w = ref.current?.contentWindow
      if (w && w.location.hash !== '#' + page) w.location.hash = page
    } catch { /* hali yuklanmagan */ }
  }, [page])
  return (
    <iframe ref={ref} title={title} src={`/legacy.html?embed=1#${page}`}
      className="block w-full rounded-3xl border-0 bg-transparent"
      style={{ height: 'calc(100dvh - 8.5rem)', minHeight: 520 }} />
  )
}

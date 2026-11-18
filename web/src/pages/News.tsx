import { useEffect } from 'react'
import { Card, EmptyState, Loading, PageHeader, Pill } from '../components/ui'
import { api } from '../lib/api'
import { useFetch } from '../lib/useFetch'

interface Item {
  id: string; ts: number; title: string; text: string; pinned: boolean
  media: { id: string; kind: string; url: string }[]
}

export default function News() {
  const { data, loading } = useFetch<{ items: Item[] }>('/api/news')
  useEffect(() => { api.post('/api/news/seen').catch(() => {}) }, [])
  return (
    <div>
      <PageHeader title="Yangiliklar" subtitle="Maktabdan so‘nggi e’lonlar" />
      {loading ? <Loading /> : !data?.items.length ? (
        <Card><EmptyState icon="bell" title="Hozircha yangilik yo‘q" text="Yangi e’lonlar shu yerda paydo bo‘ladi." /></Card>
      ) : (
        <div className="flex flex-col gap-5">
          {data.items.map((n) => (
            <Card key={n.id} title={n.title} aside={n.pinned ? <Pill tone="amber">Qadalgan</Pill> : undefined}>
              <div className="whitespace-pre-wrap text-base leading-relaxed text-ink">{n.text}</div>
              {n.media.map((m) => m.kind === 'video'
                ? <video key={m.id} src={m.url} controls className="mt-4 max-h-[420px] w-full rounded-2xl bg-black" />
                : <img key={m.id} src={m.url} alt="" loading="lazy" className="mt-4 max-h-[520px] w-full rounded-2xl object-contain" />)}
              <div className="mt-3 text-sm text-ink-soft">{new Date(n.ts).toLocaleString('uz-UZ')}</div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

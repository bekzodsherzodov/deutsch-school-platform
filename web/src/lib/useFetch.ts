import { useEffect, useState } from 'react'
import { api } from './api'

export function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let off = false
    setLoading(true)
    api.get<T>(url)
      .then((d) => { if (!off) setData(d) })
      .catch((e) => { if (!off) setError(e instanceof Error ? e.message : 'Xatolik') })
      .finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
  }, [url])
  return { data, loading, error }
}

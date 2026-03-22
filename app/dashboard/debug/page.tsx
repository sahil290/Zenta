'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugPage() {
  const [data, setData] = useState<object | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setData({ error: 'No user session' }); return }

      const { data: sub, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)

      setData({
        userId: user.id,
        email: user.email,
        subscriptions: sub,
        subError: subError?.message,
      })
    }
    load()
  }, [supabase])

  return (
    <div style={{ padding: 40, fontFamily: 'monospace', fontSize: 13 }}>
      <h2 style={{ marginBottom: 20 }}>Supabase Debug</h2>
      <pre style={{ background: '#f5f5f5', padding: 20, borderRadius: 8, whiteSpace: 'pre-wrap' }}>
        {data ? JSON.stringify(data, null, 2) : 'Loading...'}
      </pre>
    </div>
  )
}
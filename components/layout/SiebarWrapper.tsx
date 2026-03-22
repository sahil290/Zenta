'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from './Sidebar'

export function SidebarWrapper() {
  const [user, setUser] = useState({ name: '', email: '', plan: 'free' })
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) return

      const [{ data: profile }, { data: subs }] = await Promise.all([
        supabase.from('users').select('full_name').eq('id', authUser.id).single(),
        supabase.from('subscriptions').select('plan').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(1),
      ])

      setUser({
        name: profile?.full_name ?? authUser.email ?? 'My Account',
        email: authUser.email ?? '',
        plan: subs?.[0]?.plan ?? 'free',
      })
    }
    load()
  }, [supabase])

  return <Sidebar user={user} />
}
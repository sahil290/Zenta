import { Sidebar } from '@/components/layout/Sidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email')
    .eq('id', user?.id ?? '')
    .single()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('user_id', user?.id ?? '')
    .single()

  return (
    <div className="layout">
      <Sidebar user={{
        name: profile?.full_name ?? user?.email ?? 'User',
        email: profile?.email ?? user?.email ?? '',
        plan: sub?.plan ?? 'Free',
      }} />
      <div className="layout-main">{children}</div>
    </div>
  )
}
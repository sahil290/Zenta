import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface DashboardStats {
  revenue: number
  revenueLastMonth: number
  outstanding: number
  openInvoices: number
  tasksCompleted: number
  tasksThisWeek: number
  activeLeads: number
  coldLeads: number
}

export interface ActivityItem {
  id: string
  name: string
  meta: string
  tag: string
  tagColor: string
  icon: 'invoice' | 'email' | 'contact' | 'check'
  createdAt: string
}

export interface RevenuePoint {
  month: string
  revenue: number
  collected: number
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    revenue: 0, revenueLastMonth: 0,
    outstanding: 0, openInvoices: 0,
    tasksCompleted: 0, tasksThisWeek: 0,
    activeLeads: 0, coldLeads: 0,
  })
  const [activity, setActivity] = useState<ActivityItem[]>([])
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([])
  const [openInvoicesList, setOpenInvoicesList] = useState<{
    id: string
    contact_name: string
    contact_email: string
    amount: number
    status: string
    due_date: string
  }[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()
    const startOfWeek = new Date(now.getTime() - 7 * 86400000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString()

    // Fetch all in parallel
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const [invoicesRes, contactsRes, tasksRes] = await Promise.all([
      supabase.from('invoices').select('*, contacts(name, email)').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('agent_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
    ])

    const invoices = invoicesRes.data ?? []
    const contacts = contactsRes.data ?? []
    const tasks = tasksRes.data ?? []

    // Revenue stats
    const paidInvoices = invoices.filter(i => i.status === 'paid')
    const thisMonthRevenue = paidInvoices
      .filter(i => i.paid_at && i.paid_at >= startOfMonth)
      .reduce((s, i) => s + i.amount, 0)
    const lastMonthRevenue = paidInvoices
      .filter(i => i.paid_at && i.paid_at >= startOfLastMonth && i.paid_at <= endOfLastMonth)
      .reduce((s, i) => s + i.amount, 0)

    // Outstanding
    const unpaid = invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
    const outstanding = unpaid.reduce((s, i) => s + i.amount, 0)

    // Tasks
    const completedTasks = tasks.filter(t => t.status === 'completed')
    const thisWeekTasks = completedTasks.filter(t => t.completed_at && t.completed_at >= startOfWeek)

    // Leads
    const leads = contacts.filter(c => c.type === 'lead')
    const coldLeads = leads.filter(c => {
      if (!c.last_contacted_at) return true
      return new Date(c.last_contacted_at).getTime() < new Date(sevenDaysAgo).getTime()
    })

    setStats({
      revenue: thisMonthRevenue,
      revenueLastMonth: lastMonthRevenue,
      outstanding,
      openInvoices: unpaid.length,
      tasksCompleted: completedTasks.length,
      tasksThisWeek: thisWeekTasks.length,
      activeLeads: leads.length,
      coldLeads: coldLeads.length,
    })

    // Open invoices list for dashboard panel
    setOpenInvoicesList(
      invoices
        .filter(i => i.status !== 'paid')
        .slice(0, 4)
        .map(i => ({
          id: i.id,
          contact_name: (i.contacts as { name: string; email: string } | null)?.name ?? '',
          contact_email: (i.contacts as { name: string; email: string } | null)?.email ?? '',
          amount: i.amount,
          status: i.status,
          due_date: i.due_date,
        }))
    )

    // Build activity feed from tasks + recent contacts
    const activityItems: ActivityItem[] = []

    // Recent tasks
    tasks.slice(0, 3).forEach(t => {
      const inputVals = Object.values(t.input as Record<string, unknown>)
      const name = String(inputVals[0] ?? '')
      activityItems.push({
        id: t.id,
        name: `${t.type === 'invoice_chase' ? 'Invoice chased' : t.type === 'lead_followup' ? 'Follow-up sent' : t.type === 'client_onboard' ? 'Client onboarded' : 'Task completed'} · ${name}`,
        meta: timeAgo(t.created_at),
        tag: t.status === 'completed' ? 'Done' : t.status === 'running' ? 'Running' : 'Failed',
        tagColor: t.status === 'completed' ? 'green' : t.status === 'running' ? 'purple' : 'orange',
        icon: t.type === 'invoice_chase' || t.type === 'invoice_send' ? 'invoice' : 'email',
        createdAt: t.created_at,
      })
    })

    // Recent contacts
    contacts.slice(0, 2).forEach(c => {
      activityItems.push({
        id: c.id,
        name: `${c.type === 'lead' ? 'Lead added' : 'Client added'} · ${c.name}`,
        meta: timeAgo(c.created_at),
        tag: c.type === 'lead' ? 'Lead' : 'Client',
        tagColor: c.type === 'lead' ? 'orange' : 'green',
        icon: 'contact',
        createdAt: c.created_at,
      })
    })

    // Sort by date
    activityItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    setActivity(activityItems.slice(0, 4))

    // Revenue chart - last 6 months
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = d.toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0).toISOString()
      const label = d.toLocaleDateString('en-US', { month: 'short' })
      const monthRevenue = paidInvoices
        .filter(inv => inv.paid_at && inv.paid_at >= start && inv.paid_at <= end)
        .reduce((s, inv) => s + inv.amount, 0)
      const monthInvoiced = invoices
        .filter(inv => inv.created_at >= start && inv.created_at <= end)
        .reduce((s, inv) => s + inv.amount, 0)
      months.push({ month: label, revenue: monthRevenue, collected: monthInvoiced })
    }
    setRevenueData(months)

    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetch() }, [fetch])

  return { stats, activity, revenueData, openInvoicesList, loading, refetch: fetch }
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
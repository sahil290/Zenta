'use client'

import { useEffect, useRef } from 'react'
import { Topbar } from '@/components/layout/Topbar'
import { useDashboard } from '@/hooks/useDashboard'
import Link from 'next/link'

function formatCurrency(amount: number) {
  if (amount === 0) return '$0'
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0 })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getDaysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

function RevenueChart({ data }: { data: { month: string; revenue: number; collected: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!data.length) return
    let chart: { destroy?: () => void } | null = null
    const load = async () => {
      try {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)
        if (!canvasRef.current) return
        chart = new Chart(canvasRef.current, {
          type: 'line',
          data: {
            labels: data.map(d => d.month),
            datasets: [
              {
                label: 'Collected',
                data: data.map(d => d.revenue),
                borderColor: '#6c47e8',
                backgroundColor: 'rgba(108,71,232,0.08)',
                borderWidth: 2.5,
                pointBackgroundColor: '#6c47e8',
                pointRadius: 4,
                tension: 0.4,
                fill: true,
              },
              {
                label: 'Invoiced',
                data: data.map(d => d.collected),
                borderColor: '#1aad70',
                backgroundColor: 'rgba(26,173,112,0.06)',
                borderWidth: 2,
                pointBackgroundColor: '#1aad70',
                pointRadius: 3,
                tension: 0.4,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#a89ec8' } },
              y: {
                grid: { color: '#ece8f5' },
                ticks: {
                  font: { size: 11 },
                  color: '#a89ec8',
                  callback: (v: unknown) => {
                    const n = Number(v)
                    return n >= 1000 ? '$' + Math.round(n / 1000) + 'k' : '$' + n
                  },
                },
              },
            },
          },
        }) as { destroy?: () => void }
      } catch { /* chart.js not installed */ }
    }
    load()
    return () => { chart?.destroy?.() }
  }, [data])

  return <div style={{ height: 140, position: 'relative' }}><canvas ref={canvasRef} /></div>
}

export default function DashboardPage() {
  const { stats, activity, revenueData, openInvoicesList, loading } = useDashboard()

  const revChange = stats.revenueLastMonth > 0
    ? Math.round(((stats.revenue - stats.revenueLastMonth) / stats.revenueLastMonth) * 100)
    : null

  const STATS = [
    {
      label: 'Revenue this month',
      value: loading ? '...' : formatCurrency(stats.revenue),
      badge: loading ? '' : revChange !== null ? `${revChange >= 0 ? '+' : ''}${revChange}%` : 'New',
      color: 'purple',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
        </svg>
      ),
    },
    {
      label: 'Outstanding',
      value: loading ? '...' : formatCurrency(stats.outstanding),
      badge: loading ? '' : `${stats.openInvoices} open`,
      color: 'orange',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6M9 13h6M9 17h4" />
        </svg>
      ),
    },
    {
      label: 'Tasks completed',
      value: loading ? '...' : String(stats.tasksCompleted),
      badge: loading ? '' : `+${stats.tasksThisWeek} week`,
      color: 'green',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <path d="M22 4L12 14.01l-3-3" />
        </svg>
      ),
    },
    {
      label: 'Active leads',
      value: loading ? '...' : String(stats.activeLeads),
      badge: loading ? '' : `${stats.coldLeads} cold`,
      color: 'blue',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
    },
  ]

  const iconMap: Record<string, React.ReactNode> = {
    invoice: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
      </svg>
    ),
    email: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" />
      </svg>
    ),
    contact: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
      </svg>
    ),
  }

  return (
    <>
      <Topbar />

      <div className="stat-grid">
        {STATS.map(s => (
          <div key={s.label} className={`stat-card stat-card-${s.color}`}>
            <div className="stat-card-top">
              <div className="stat-card-icon">{s.icon}</div>
              {s.badge && <span className="stat-card-badge">{s.badge}</span>}
            </div>
            <div>
              <div className="stat-card-value">{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="page-content">
        <div className="content-grid-2">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Revenue overview</span>
              <Link href="/dashboard/invoices" className="panel-link">View invoices</Link>
            </div>
            {loading ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a89ec8', fontSize: 13 }}>
                Loading chart...
              </div>
            ) : revenueData.every(d => d.revenue === 0 && d.collected === 0) ? (
              <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a89ec8', fontSize: 13 }}>
                No revenue data yet — create and pay your first invoice
              </div>
            ) : (
              <RevenueChart data={revenueData} />
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Needs attention</span>
              <Link href="/dashboard/tasks" className="panel-link">Run agent</Link>
            </div>
            {loading ? (
              <div style={{ color: '#a89ec8', fontSize: 13 }}>Loading...</div>
            ) : openInvoicesList.length === 0 ? (
              <div style={{ color: '#a89ec8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No open invoices — all clear!
              </div>
            ) : openInvoicesList.map(inv => (
              <div key={inv.id} className="quick-action" style={{ marginBottom: 8 }}>
                <div className="quick-action-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#6c47e8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="quick-action-title">
                    {inv.status === 'overdue' ? 'Chase invoice' : 'Invoice pending'} · {inv.contact_name}
                  </div>
                  <div className="quick-action-sub">
                    {formatCurrency(inv.amount)} · {inv.status === 'overdue' ? `${getDaysOverdue(inv.due_date)}d overdue` : `due ${formatDate(inv.due_date)}`}
                  </div>
                </div>
                <Link href="/dashboard/tasks" className="quick-action-arrow">›</Link>
              </div>
            ))}
          </div>
        </div>

        <div className="content-grid-equal">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Recent activity</span>
              <Link href="/dashboard/tasks" className="panel-link">See all</Link>
            </div>
            {loading ? (
              <div style={{ color: '#a89ec8', fontSize: 13 }}>Loading...</div>
            ) : activity.length === 0 ? (
              <div style={{ color: '#a89ec8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No activity yet — add a contact or run an agent task
              </div>
            ) : activity.map(a => (
              <div key={a.id} className="activity-row">
                <div className={`activity-icon ai-${a.tagColor}`}>
                  {iconMap[a.icon]}
                </div>
                <div className="activity-info">
                  <div className="activity-name">{a.name}</div>
                  <div className="activity-meta">{a.meta}</div>
                </div>
                <span className={`tag tag-${a.tagColor}`}>{a.tag}</span>
              </div>
            ))}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Invoice status</span>
              <Link href="/dashboard/invoices" className="panel-link">Manage</Link>
            </div>
            {loading ? (
              <div style={{ color: '#a89ec8', fontSize: 13 }}>Loading...</div>
            ) : openInvoicesList.length === 0 ? (
              <div style={{ color: '#a89ec8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No invoices yet — <Link href="/dashboard/invoices" style={{ color: '#6c47e8' }}>create one</Link>
              </div>
            ) : openInvoicesList.map(inv => (
              <div key={inv.id} className="activity-row">
                <div className={`activity-icon ai-${inv.status === 'overdue' ? 'orange' : inv.status === 'paid' ? 'green' : 'blue'}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" />
                  </svg>
                </div>
                <div className="activity-info">
                  <div className="activity-name">{inv.contact_name || '—'}</div>
                  <div className="activity-meta">
                    {inv.status === 'overdue' ? `${getDaysOverdue(inv.due_date)}d overdue` : `Due ${formatDate(inv.due_date)}`}
                  </div>
                </div>
                <span className={`tag tag-${inv.status === 'overdue' ? 'orange' : 'blue'}`}>
                  {formatCurrency(inv.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
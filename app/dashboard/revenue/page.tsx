'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import './revenue.css'

interface Invoice {
  id: string
  amount: number
  status: string
  due_date: string
  paid_at: string | null
  created_at: string
  contact_name?: string
  contacts?: { name: string; email: string } | null
}

interface MonthData {
  month: string
  collected: number
  invoiced: number
  count: number
}

function formatCurrency(n: number) {
  if (n >= 1000) return '$' + (n / 1000).toFixed(1) + 'k'
  return '$' + n.toLocaleString()
}

function formatFull(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function BarChart({ data }: { data: MonthData[] }) {
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
          type: 'bar',
          data: {
            labels: data.map(d => d.month),
            datasets: [
              {
                label: 'Collected',
                data: data.map(d => d.collected),
                backgroundColor: '#6c47e8',
                borderRadius: 6,
                borderSkipped: false,
              },
              {
                label: 'Invoiced',
                data: data.map(d => d.invoiced),
                backgroundColor: '#ede8fb',
                borderRadius: 6,
                borderSkipped: false,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: ctx => ` ${ctx.dataset.label}: $${ctx.parsed.y.toLocaleString()}`,
                },
              },
            },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#a89ec8' } },
              y: {
                grid: { color: '#f0edf8' },
                ticks: {
                  font: { size: 11 },
                  color: '#a89ec8',
                  callback: (v: unknown) => formatCurrency(Number(v)),
                },
              },
            },
          },
        }) as { destroy?: () => void }
      } catch { /* chart.js not loaded */ }
    }
    load()
    return () => { chart?.destroy?.() }
  }, [data])

  return <canvas ref={canvasRef} />
}

function LineChart({ data }: { data: MonthData[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!data.length) return
    let chart: { destroy?: () => void } | null = null
    const load = async () => {
      try {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)
        if (!canvasRef.current) return
        // Running total
        let running = 0
        const cumulativeData = data.map(d => { running += d.collected; return running })
        chart = new Chart(canvasRef.current, {
          type: 'line',
          data: {
            labels: data.map(d => d.month),
            datasets: [{
              label: 'Cumulative revenue',
              data: cumulativeData,
              borderColor: '#1aad70',
              backgroundColor: 'rgba(26,173,112,0.08)',
              borderWidth: 2.5,
              pointBackgroundColor: '#1aad70',
              pointRadius: 4,
              tension: 0.4,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#a89ec8' } },
              y: {
                grid: { color: '#f0edf8' },
                ticks: {
                  font: { size: 11 },
                  color: '#a89ec8',
                  callback: (v: unknown) => formatCurrency(Number(v)),
                },
              },
            },
          },
        }) as { destroy?: () => void }
      } catch { /* */ }
    }
    load()
    return () => { chart?.destroy?.() }
  }, [data])

  return <canvas ref={canvasRef} />
}

export default function RevenuePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [monthData, setMonthData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'3m' | '6m' | '12m'>('6m')
  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('invoices')
        .select('*, contacts(name, email)')
        .order('created_at', { ascending: false })
      const all = (data ?? []).map((inv: Invoice) => ({
        ...inv,
        contact_name: (inv.contacts as { name: string } | null)?.name ?? 'Unknown',
      }))
      setInvoices(all)

      // Build monthly data
      const months = period === '3m' ? 3 : period === '6m' ? 6 : 12
      const now = new Date()
      const points: MonthData[] = []
      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const start = d.toISOString()
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59).toISOString()
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
        const monthInvoices = all.filter((inv: Invoice) => inv.created_at >= start && inv.created_at <= end)
        const collected = monthInvoices.filter((inv: Invoice) => inv.status === 'paid').reduce((s: number, inv: Invoice) => s + inv.amount, 0)
        const invoiced = monthInvoices.reduce((s: number, inv: Invoice) => s + inv.amount, 0)
        points.push({ month: label, collected, invoiced, count: monthInvoices.length })
      }
      setMonthData(points)
      setLoading(false)
    }
    load()
  }, [supabase, period])

  // Stats
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0).toISOString()

  const paid = invoices.filter(i => i.status === 'paid')
  const thisMonth = paid.filter(i => i.paid_at && i.paid_at >= startOfMonth).reduce((s, i) => s + i.amount, 0)
  const lastMonth = paid.filter(i => i.paid_at && i.paid_at >= startOfLastMonth && i.paid_at <= endOfLastMonth).reduce((s, i) => s + i.amount, 0)
  const totalRevenue = paid.reduce((s, i) => s + i.amount, 0)
  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const overdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
  const avgInvoice = paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0
  const collectionRate = invoices.length > 0 ? Math.round((paid.length / invoices.length) * 100) : 0
  const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null

  // Top clients by revenue
  const clientRevenue: Record<string, number> = {}
  paid.forEach(inv => {
    const name = inv.contact_name ?? 'Unknown'
    clientRevenue[name] = (clientRevenue[name] ?? 0) + inv.amount
  })
  const topClients = Object.entries(clientRevenue)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  const maxClientRevenue = topClients[0]?.[1] ?? 1

  // Status breakdown
  const statusBreakdown = [
    { label: 'Paid', color: '#1aad70', value: paid.reduce((s, i) => s + i.amount, 0), dot: '#1aad70' },
    { label: 'Outstanding', color: '#2563eb', value: invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.amount, 0), dot: '#2563eb' },
    { label: 'Overdue', color: '#f07030', value: overdue, dot: '#f07030' },
    { label: 'Draft', color: '#a89ec8', value: invoices.filter(i => i.status === 'draft').reduce((s, i) => s + i.amount, 0), dot: '#a89ec8' },
  ]
  const totalAll = statusBreakdown.reduce((s, b) => s + b.value, 0) || 1

  const recentPaid = paid.slice(0, 6)

  const hasData = invoices.length > 0

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Revenue</h1>
          <p className="topbar-sub">
            {loading ? 'Loading...' : `${formatFull(totalRevenue)} total collected · ${paid.length} paid invoices`}
          </p>
        </div>
        <div className="topbar-right">
          <div className="revenue-filter-tabs">
            {(['3m', '6m', '12m'] as const).map(p => (
              <button key={p} className={`revenue-filter-tab${period === p ? ' active' : ''}`} onClick={() => setPeriod(p)}>
                {p === '3m' ? '3 months' : p === '6m' ? '6 months' : '12 months'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="page-content">
        {/* Stats */}
        <div className="revenue-stats">
          <div className="rev-stat">
            <div className="rev-stat-label">This month</div>
            <div className="rev-stat-value">{loading ? '...' : formatFull(thisMonth)}</div>
            <div className={`rev-stat-change ${monthChange === null ? 'neutral' : monthChange >= 0 ? 'up' : 'down'}`}>
              {monthChange === null ? '— first month' : `${monthChange >= 0 ? '↑' : '↓'} ${Math.abs(monthChange)}% vs last month`}
            </div>
          </div>
          <div className="rev-stat">
            <div className="rev-stat-label">Total revenue</div>
            <div className="rev-stat-value">{loading ? '...' : formatFull(totalRevenue)}</div>
            <div className="rev-stat-change neutral">{paid.length} paid invoices</div>
          </div>
          <div className="rev-stat">
            <div className="rev-stat-label">Outstanding</div>
            <div className="rev-stat-value">{loading ? '...' : formatFull(outstanding)}</div>
            <div className={`rev-stat-change ${overdue > 0 ? 'down' : 'neutral'}`}>
              {overdue > 0 ? `${formatFull(overdue)} overdue` : 'Nothing overdue'}
            </div>
          </div>
          <div className="rev-stat">
            <div className="rev-stat-label">Collection rate</div>
            <div className="rev-stat-value">{loading ? '...' : `${collectionRate}%`}</div>
            <div className="rev-stat-change neutral">Avg invoice {formatFull(avgInvoice)}</div>
          </div>
        </div>

        {/* Charts row */}
        <div className="revenue-grid">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Monthly revenue</span>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6a6085' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#6c47e8', display: 'inline-block' }} />Collected
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#6a6085' }}>
                  <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ede8fb', display: 'inline-block' }} />Invoiced
                </span>
              </div>
            </div>
            {loading ? (
              <div className="empty-chart">Loading...</div>
            ) : !hasData ? (
              <div className="empty-chart">
                <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                No invoice data yet
              </div>
            ) : (
              <div className="chart-wrap"><BarChart data={monthData} /></div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Invoice breakdown</span>
            </div>
            {statusBreakdown.map(b => (
              <div key={b.label} className="breakdown-item">
                <div className="breakdown-dot" style={{ background: b.dot }} />
                <span className="breakdown-label">{b.label}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar" style={{ width: `${Math.round((b.value / totalAll) * 100)}%`, background: b.color }} />
                </div>
                <span className="breakdown-value">{formatCurrency(b.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="revenue-grid-bottom">
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Cumulative revenue</span>
            </div>
            {loading ? (
              <div className="empty-chart">Loading...</div>
            ) : !hasData ? (
              <div className="empty-chart">
                <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                No data yet
              </div>
            ) : (
              <div className="chart-wrap"><LineChart data={monthData} /></div>
            )}
          </div>

          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Top clients</span>
            </div>
            {topClients.length === 0 ? (
              <div style={{ color: '#a89ec8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
                No paid invoices yet
              </div>
            ) : topClients.map(([name, amount], i) => (
              <div key={name} className="breakdown-item">
                <div className="breakdown-dot" style={{ background: ['#6c47e8', '#1aad70', '#2563eb', '#f07030', '#c026a8'][i] }} />
                <span className="breakdown-label">{name}</span>
                <div className="breakdown-bar-wrap">
                  <div className="breakdown-bar" style={{ width: `${Math.round((amount / maxClientRevenue) * 100)}%`, background: ['#6c47e8', '#1aad70', '#2563eb', '#f07030', '#c026a8'][i] }} />
                </div>
                <span className="breakdown-value">{formatCurrency(amount)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="panel" style={{ marginTop: 14 }}>
          <div className="panel-header">
            <span className="panel-title">Recent payments</span>
            <span style={{ fontSize: 12, color: '#a89ec8' }}>{paid.length} total</span>
          </div>
          {recentPaid.length === 0 ? (
            <div style={{ color: '#a89ec8', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              No payments yet — mark invoices as paid to see them here
            </div>
          ) : recentPaid.map(inv => (
            <div key={inv.id} className="invoice-row">
              <span className="invoice-row-client">{inv.contact_name}</span>
              <span className="invoice-row-date">{formatDate(inv.paid_at ?? inv.created_at)}</span>
              <span className="tag tag-green">Paid</span>
              <span className="invoice-row-amount">{formatFull(inv.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
'use client'

import { useState } from 'react'
import { useInvoices, type NewInvoice, type InvoiceStatus } from '@/hooks/useInvoices'
import { useContacts } from '@/hooks/useContacts'
import './invoices.css'

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue',
}

function formatCurrency(amount: number) {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDaysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

function getInvoiceNumber(index: number) {
  return `INV-${String(index + 1).padStart(3, '0')}`
}

interface LineItem { id: string; description: string; qty: number; rate: number }

interface CreateModalProps {
  onClose: () => void
  onSave: (inv: NewInvoice) => Promise<void>
  contacts: { id: string; name: string; email: string }[]
}

function CreateModal({ onClose, onSave, contacts }: CreateModalProps) {
  const [selectedContact, setSelectedContact] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [status, setStatus] = useState<InvoiceStatus>('draft')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ id: '1', description: '', qty: 1, rate: 0 }])
  const [saving, setSaving] = useState(false)

  const total = lineItems.reduce((s, l) => s + l.qty * l.rate, 0)
  const contact = contacts.find(c => c.id === selectedContact)

  const addLine = () => setLineItems(prev => [...prev, { id: Date.now().toString(), description: '', qty: 1, rate: 0 }])
  const removeLine = (id: string) => setLineItems(prev => prev.filter(l => l.id !== id))
  const updateLine = (id: string, field: keyof LineItem, value: string | number) =>
    setLineItems(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      contact_id: selectedContact || undefined,
      contact_name: contact?.name ?? manualName,
      contact_email: contact?.email ?? manualEmail,
      amount: total,
      status,
      due_date: dueDate,
      description: lineItems.map(l => l.description).filter(Boolean).join(', '),
    })
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">New invoice</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Client</label>
            <select className="modal-input" value={selectedContact} onChange={e => setSelectedContact(e.target.value)}>
              <option value="">— Enter manually —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name} ({c.email})</option>)}
            </select>
          </div>

          {!selectedContact && (
            <div className="modal-row">
              <div className="modal-field">
                <label className="modal-label">Client name</label>
                <input className="modal-input" placeholder="Pixel Studio" value={manualName} onChange={e => setManualName(e.target.value)} required />
              </div>
              <div className="modal-field">
                <label className="modal-label">Client email</label>
                <input className="modal-input" type="email" placeholder="billing@client.com" value={manualEmail} onChange={e => setManualEmail(e.target.value)} required />
              </div>
            </div>
          )}

          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Due date</label>
              <input className="modal-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
            </div>
            <div className="modal-field">
              <label className="modal-label">Status</label>
              <select className="modal-input" value={status} onChange={e => setStatus(e.target.value as InvoiceStatus)}>
                <option value="draft">Save as draft</option>
                <option value="sent">Send now</option>
              </select>
            </div>
          </div>

          <div className="modal-divider" />

          <div className="modal-field">
            <label className="modal-label">Line items</label>
            <div className="line-items">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 80px 28px', gap: 8 }}>
                <span style={{ fontSize: 11, color: '#a89ec8', fontWeight: 600 }}>Description</span>
                <span style={{ fontSize: 11, color: '#a89ec8', fontWeight: 600 }}>Qty</span>
                <span style={{ fontSize: 11, color: '#a89ec8', fontWeight: 600 }}>Rate ($)</span>
                <span />
              </div>
              {lineItems.map(line => (
                <div key={line.id} className="line-item">
                  <input className="modal-input" placeholder="Service" value={line.description} onChange={e => updateLine(line.id, 'description', e.target.value)} />
                  <input className="modal-input" type="number" min={1} value={line.qty} onChange={e => updateLine(line.id, 'qty', Number(e.target.value))} />
                  <input className="modal-input" type="number" min={0} value={line.rate} onChange={e => updateLine(line.id, 'rate', Number(e.target.value))} />
                  <button type="button" className="remove-line-btn" onClick={() => removeLine(line.id)}>✕</button>
                </div>
              ))}
              <button type="button" className="add-line-btn" onClick={addLine}>+ Add line item</button>
              <div className="line-item-total">
                <span className="line-item-total-label">Total</span>
                <span className="line-item-total-value">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving || total === 0}>
              {saving ? 'Saving...' : status === 'sent' ? 'Create & send' : 'Save draft'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InvoicesPage() {
  const { invoices, loading, error, stats, addInvoice, updateStatus } = useInvoices()
  const { contacts } = useContacts()
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [chasingId, setChasingId] = useState<string | null>(null)
  const [toast, setToast] = useState('')

  const filtered = invoices.filter(inv => {
    const matchSearch = (inv.contact_name ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || inv.status === filter
    return matchSearch && matchFilter
  })

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleChase = async (inv: { id: string; contact_name?: string; contact_email?: string; amount: number }) => {
    setChasingId(inv.id)
    try {
      await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskType: 'invoice_chase',
          input: {
            contact_name: inv.contact_name,
            contact_email: inv.contact_email,
            amount: formatCurrency(inv.amount),
            days_overdue: 'overdue',
          },
        }),
      })
      showToast(`Chase email sent to ${inv.contact_name}`)
    } catch {
      showToast('Failed to run agent')
    }
    setChasingId(null)
  }

  const handleMarkPaid = async (id: string) => {
    await updateStatus(id, 'paid')
    showToast('Invoice marked as paid')
  }

  const handleDownloadPDF = (inv: { contact_name?: string; contact_email?: string; amount: number; due_date: string; created_at: string; description?: string | null }) => {
    const num = getInvoiceNumber(invoices.findIndex(i => i.amount === inv.amount))
    const content = [
      `INVOICE ${num}`,
      '─'.repeat(40),
      `To:   ${inv.contact_name} <${inv.contact_email}>`,
      `Date: ${formatDate(inv.created_at)}`,
      `Due:  ${formatDate(inv.due_date)}`,
      '',
      inv.description ?? '',
      '',
      '─'.repeat(40),
      `TOTAL: ${formatCurrency(inv.amount)}`,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${num}.txt`
    a.click()
    URL.revokeObjectURL(url)
    showToast(`${num} downloaded`)
  }

  const handleSave = async (inv: NewInvoice) => {
    const result = await addInvoice(inv)
    if ('error' in result && result.error) showToast(`Error: ${result.error}`)
    else showToast(`Invoice ${inv.status === 'sent' ? 'sent' : 'saved'}`)
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Invoices</h1>
          <p className="topbar-sub">
            {loading ? 'Loading...' : `${invoices.length} total · ${invoices.filter(i => i.status === 'overdue').length} overdue`}
          </p>
        </div>
        <div className="topbar-right">
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 13, height: 13 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            New invoice
          </button>
        </div>
      </header>

      <div className="page-content">
        {error && (
          <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', color: '#d05820', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="invoices-stats">
          <div className="inv-stat">
            <div className="inv-stat-label">Total invoiced</div>
            <div className="inv-stat-value">{formatCurrency(stats.total)}</div>
            <div className="inv-stat-sub muted">{invoices.length} invoices</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat-label">Outstanding</div>
            <div className="inv-stat-value">{formatCurrency(stats.outstanding)}</div>
            <div className="inv-stat-sub warn">{invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length} unpaid</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat-label">Overdue</div>
            <div className="inv-stat-value">{formatCurrency(stats.overdue)}</div>
            <div className="inv-stat-sub warn">{invoices.filter(i => i.status === 'overdue').length} invoices</div>
          </div>
          <div className="inv-stat">
            <div className="inv-stat-label">Collected</div>
            <div className="inv-stat-value">{formatCurrency(stats.paid)}</div>
            <div className="inv-stat-sub up">{invoices.filter(i => i.status === 'paid').length} paid</div>
          </div>
        </div>

        <div className="invoices-toolbar">
          <div className="topbar-search" style={{ flex: 1, maxWidth: 300 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 13, height: 13, color: '#a89ec8' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input className="topbar-search-input" placeholder="Search by client..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="filter-tabs">
            {(['all', 'draft', 'sent', 'overdue', 'paid'] as const).map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : STATUS_LABELS[f as InvoiceStatus]}
              </button>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="inv-empty">Loading invoices...</div>
          ) : (
            <table className="invoices-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Client</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Issued</th>
                  <th>Due date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="inv-empty">
                    {search || filter !== 'all' ? 'No invoices match' : 'No invoices yet — create your first one'}
                  </td></tr>
                ) : filtered.map((inv, _idx) => (
                  <tr key={inv.id}>
                    <td><span className="inv-number">{getInvoiceNumber(invoices.indexOf(inv))}</span></td>
                    <td>
                      <div className="inv-client-name">{inv.contact_name || '—'}</div>
                      <div className="inv-client-email">{inv.contact_email || ''}</div>
                    </td>
                    <td><span className="inv-amount">{formatCurrency(inv.amount)}</span></td>
                    <td><span className={`status-badge status-${inv.status}`}>{STATUS_LABELS[inv.status]}</span></td>
                    <td><span className="inv-date">{formatDate(inv.created_at)}</span></td>
                    <td>
                      {inv.status === 'overdue'
                        ? <span className="inv-overdue">{getDaysOverdue(inv.due_date)}d overdue</span>
                        : <span className="inv-date">{formatDate(inv.due_date)}</span>
                      }
                    </td>
                    <td>
                      <div className="inv-actions">
                        {(inv.status === 'sent' || inv.status === 'overdue') && (
                          <button className={`action-icon-btn warn${chasingId === inv.id ? ' spinning' : ''}`} title="Chase with AI" onClick={() => handleChase(inv)} disabled={chasingId === inv.id}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              {chasingId === inv.id
                                ? <path d="M21 12a9 9 0 11-6.219-8.56" />
                                : <><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.55a16 16 0 006.54 6.54l1.62-1.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></>
                              }
                            </svg>
                          </button>
                        )}
                        {inv.status !== 'paid' && (
                          <button className="action-icon-btn success" title="Mark paid" onClick={() => handleMarkPaid(inv.id)}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                            </svg>
                          </button>
                        )}
                        <button className="action-icon-btn" title="Download" onClick={() => handleDownloadPDF(inv)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="inv-footer">
          <span>Showing {filtered.length} of {invoices.length} invoices</span>
          <span>{formatCurrency(filtered.reduce((s, i) => s + i.amount, 0))} total shown</span>
        </div>
      </div>

      {showModal && <CreateModal onClose={() => setShowModal(false)} onSave={handleSave} contacts={contacts} />}
      {toast && <div className="chase-toast">{toast}</div>}
    </>
  )
}
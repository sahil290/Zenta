'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useContacts } from '@/hooks/useContacts'
import { useInvoices } from '@/hooks/useInvoices'
import { createClient } from '@/lib/supabase/client'
import './tasks.css'

type TaskType = 'invoice_chase' | 'lead_followup' | 'client_onboard' | 'invoice_send' | 'proposal_draft' | 'weekly_report' | 'crm_sync'
type TabType = 'run' | 'drafts' | 'history'

interface TaskTypeConfig {
  label: string
  desc: string
  color: string
  requiresReview: boolean
  needsContact: boolean
  needsInvoice: boolean
  extraFields: { key: string; label: string; placeholder: string; type?: string; textarea?: boolean }[]
  icon: React.ReactNode
}

const TASK_TYPES: Record<TaskType, TaskTypeConfig> = {
  invoice_chase: {
    label: 'Chase invoice',
    desc: 'Follow up on overdue payment',
    color: 'orange',
    requiresReview: false,
    needsContact: true,
    needsInvoice: true,
    extraFields: [],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.55a16 16 0 006.54 6.54l1.62-1.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  },
  lead_followup: {
    label: 'Follow up lead',
    desc: 'Re-engage cold prospect',
    color: 'purple',
    requiresReview: true,
    needsContact: true,
    needsInvoice: false,
    extraFields: [{ key: 'context', label: 'Context / notes', placeholder: 'Interested in web redesign...', textarea: true }],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
  },
  client_onboard: {
    label: 'Onboard client',
    desc: 'Welcome new client',
    color: 'green',
    requiresReview: true,
    needsContact: true,
    needsInvoice: false,
    extraFields: [{ key: 'project_type', label: 'Project type', placeholder: 'E-commerce website' }],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  invoice_send: {
    label: 'Send invoice',
    desc: 'Generate and send invoice',
    color: 'blue',
    requiresReview: true,
    needsContact: true,
    needsInvoice: true,
    extraFields: [],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>,
  },
  proposal_draft: {
    label: 'Draft proposal',
    desc: 'Write project proposal',
    color: 'pink',
    requiresReview: true,
    needsContact: true,
    needsInvoice: false,
    extraFields: [
      { key: 'project_type', label: 'Project type', placeholder: 'Mobile app development' },
      { key: 'budget', label: 'Budget', placeholder: '$15,000' },
    ],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  },
  weekly_report: {
    label: 'Weekly report',
    desc: 'Generate business summary',
    color: 'teal',
    requiresReview: false,
    needsContact: false,
    needsInvoice: false,
    extraFields: [{ key: 'period', label: 'Period', placeholder: 'Week of March 18, 2025' }],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  crm_sync: {
    label: 'CRM sync',
    desc: 'Update contact record',
    color: 'teal',
    requiresReview: false,
    needsContact: true,
    needsInvoice: false,
    extraFields: [{ key: 'notes', label: 'Notes', placeholder: 'Called today, interested in Q2 project', textarea: true }],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  },
}

const TASK_LABELS: Record<string, string> = {
  invoice_chase: 'Invoice chase',
  lead_followup: 'Lead follow-up',
  client_onboard: 'Client onboarding',
  invoice_send: 'Invoice sent',
  proposal_draft: 'Proposal draft',
  weekly_report: 'Weekly report',
  crm_sync: 'CRM sync',
}

function timeAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function getDaysOverdue(d: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(d).getTime()) / 86400000))
}

export default function TasksPage() {
  const { tasks, loading: tasksLoading, refetch, creditsUsed } = useTasks()
  const { contacts } = useContacts()
  const { invoices } = useInvoices()

  const [tab, setTab] = useState<TabType>('run')
  const [selectedType, setSelectedType] = useState<TaskType>('invoice_chase')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedOutput, setEditedOutput] = useState('')
  const [error, setError] = useState('')
  const supabase = createClient()

  const [sendModes, setSendModes] = useState<Record<TaskType, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('zenta-send-modes')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return {
      invoice_chase: false,
      lead_followup: true,
      client_onboard: true,
      invoice_send: true,
      proposal_draft: true,
      weekly_report: false,
      crm_sync: false,
    }
  })

  const toggleSendMode = (type: TaskType) => {
    setSendModes(prev => {
      const next = { ...prev, [type]: !prev[type] }
      localStorage.setItem('zenta-send-modes', JSON.stringify(next))
      return next
    })
  }

  const config = TASK_TYPES[selectedType]
  const requiresReview = sendModes[selectedType]
  const maxCredits = 1000
  const creditPct = Math.min(100, Math.round((creditsUsed / maxCredits) * 100))

  const selectedContact = contacts.find(c => c.id === selectedContactId)
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId)
  const contactInvoices = invoices.filter(inv =>
    selectedContactId
      ? inv.contact_id === selectedContactId || inv.contact_name === selectedContact?.name
      : true
  ).filter(inv => inv.status !== 'paid')

  const drafts = tasks.filter(t => t.status === 'pending_review')
  const history = tasks.filter(t => t.status !== 'pending_review')

  useEffect(() => {
    setSelectedContactId('')
    setSelectedInvoiceId('')
    setExtraFields({})
    setError('')
  }, [selectedType])

  useEffect(() => {
    if (selectedContactId && config.needsInvoice && contactInvoices.length === 1) {
      setSelectedInvoiceId(contactInvoices[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId, selectedType])

  const buildInput = (): Record<string, string> => {
    const input: Record<string, string> = {}
    if (selectedContact) {
      input.contact_name = selectedContact.name
      input.contact_email = selectedContact.email
      input.company = selectedContact.company ?? ''
    }
    if (selectedInvoice) {
      input.amount = `$${selectedInvoice.amount.toLocaleString()}`
      input.due_date = formatDate(selectedInvoice.due_date)
      input.days_overdue = String(getDaysOverdue(selectedInvoice.due_date))
      input.description = selectedInvoice.description ?? ''
    }
    return { ...input, ...extraFields }
  }

  const isReady = () => {
    if (config.needsContact && !selectedContactId) return false
    if (config.needsInvoice && !selectedInvoiceId) return false
    if (config.extraFields.some(f => !f.textarea && !extraFields[f.key]?.trim())) return false
    return true
  }

  const getToken = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  const handleRun = async () => {
    setRunning(true)
    setError('')
    try {
      const token = await getToken()

      // For weekly report, gather real stats from client-side data
      const inputData = buildInput()
      if (selectedType === 'weekly_report') {
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

        const paidThisMonth = invoices.filter(i => i.status === 'paid' && (i.paid_at ?? '') >= monthStart).reduce((s, i) => s + i.amount, 0)
        const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0)
        const overdueCount = invoices.filter(i => i.status === 'overdue').length
        const newContacts = contacts.filter(c => c.created_at >= weekAgo).length
        const leads = contacts.filter(c => c.type === 'lead').length
        const clients = contacts.filter(c => c.type === 'client').length
        const tasksThisWeek = tasks.filter(t => t.status === 'completed' && t.created_at >= weekAgo).length

        inputData.real_stats = JSON.stringify({
          revenue_this_month: `$${paidThisMonth.toLocaleString()}`,
          outstanding: `$${outstanding.toLocaleString()}`,
          overdue_invoices: overdueCount,
          new_contacts_this_week: newContacts,
          total_leads: leads,
          total_clients: clients,
          agent_tasks_completed_this_week: tasksThisWeek,
          total_invoices: invoices.length,
        })
      }
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskType: selectedType,
          input: inputData,
          draftMode: requiresReview,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Task failed')
      await refetch()
      if (data.pendingReview) {
        setTab('drafts')
        setExpandedId(data.taskId)
      }
      setSelectedInvoiceId('')
      setExtraFields({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setRunning(false)
  }

  const [approvingId, setApprovingId] = useState<string | null>(null)

  const handleApprove = async (taskId: string, output: string) => {
    setApprovingId(taskId)
    const token = await getToken()
    const res = await fetch('/api/agent/approve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ taskId, editedOutput: output }),
    })
    if (res.ok) {
      await refetch()
      setEditingId(null)
    }
    setApprovingId(null)
  }

  const handleReject = async (taskId: string) => {
    const token = await getToken()
    await fetch('/api/agent/reject', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ taskId }),
    })
    await refetch()
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Agent tasks</h1>
          <p className="topbar-sub">
            {tasksLoading ? 'Loading...' : `${tasks.filter(t => t.status === 'completed').length} completed · ${drafts.length} awaiting review · ${creditsUsed} credits used`}
          </p>
        </div>
        {drafts.length > 0 && (
          <div className="topbar-right">
            <button className="btn-primary" onClick={() => setTab('drafts')} style={{ position: 'relative' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 13, height: 13 }}>
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              {drafts.length} draft{drafts.length > 1 ? 's' : ''} to review
            </button>
          </div>
        )}
      </header>

      <div className="page-content">
        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, background: '#f0edf8', borderRadius: 9, padding: 3, marginBottom: 16, width: 'fit-content' }}>
          {([
            { id: 'run', label: 'Run agent' },
            { id: 'drafts', label: `Drafts${drafts.length > 0 ? ` (${drafts.length})` : ''}` },
            { id: 'history', label: 'History' },
          ] as { id: TabType; label: string }[]).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 7,
                border: 'none',
                background: tab === t.id ? '#fff' : 'transparent',
                color: tab === t.id ? '#6c47e8' : '#6a6085',
                fontWeight: 500,
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: tab === t.id ? '0 1px 3px rgba(108,71,232,0.15)' : 'none',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* RUN TAB */}
        {tab === 'run' && (
          <div className="tasks-layout">
            <div className="tasks-run-panel">
              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">Choose task</span>
                </div>
                <div className="task-type-grid">
                  {(Object.entries(TASK_TYPES) as [TaskType, TaskTypeConfig][]).map(([type, cfg]) => (
                    <button
                      key={type}
                      className={`task-type-card${selectedType === type ? ' selected' : ''}`}
                      onClick={() => setSelectedType(type)}
                    >
                      <div className={`task-type-icon ti-${cfg.color}`}>{cfg.icon}</div>
                      <div className="task-type-name">{cfg.label}</div>
                      <div className="task-type-desc">{cfg.desc}</div>
                      {sendModes[type] && (
                        <div style={{ fontSize: 10, color: '#f07030', fontWeight: 600, marginTop: 4 }}>
                          ● Review before send
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span className="panel-title">{config.label}</span>
                  {requiresReview && (
                    <span style={{ fontSize: 11, color: '#f07030', fontWeight: 600, background: '#fff4ec', padding: '3px 10px', borderRadius: 20 }}>
                      Draft → Review → Send
                    </span>
                  )}
                </div>
                <div className="run-form">
                  {config.needsContact && (
                    <div className="run-field">
                      <label className="run-label">Contact</label>
                      <select className="run-input" value={selectedContactId} onChange={e => { setSelectedContactId(e.target.value); setSelectedInvoiceId('') }}>
                        <option value="">— Select a contact —</option>
                        {contacts.map(c => <option key={c.id} value={c.id}>{c.name} · {c.email}</option>)}
                      </select>
                      {selectedContact && (
                        <div className="autofill-preview">
                          <div className="autofill-row"><span className="autofill-label">Name</span><span className="autofill-value">{selectedContact.name}</span></div>
                          <div className="autofill-row"><span className="autofill-label">Email</span><span className="autofill-value">{selectedContact.email}</span></div>
                          {selectedContact.company && <div className="autofill-row"><span className="autofill-label">Company</span><span className="autofill-value">{selectedContact.company}</span></div>}
                        </div>
                      )}
                    </div>
                  )}

                  {config.needsInvoice && selectedContactId && (
                    <div className="run-field">
                      <label className="run-label">Invoice</label>
                      {contactInvoices.length === 0 ? (
                        <div className="autofill-preview"><span className="autofill-label">No unpaid invoices for this contact</span></div>
                      ) : (
                        <>
                          <select className="run-input" value={selectedInvoiceId} onChange={e => setSelectedInvoiceId(e.target.value)}>
                            <option value="">— Select an invoice —</option>
                            {contactInvoices.map(inv => <option key={inv.id} value={inv.id}>${inv.amount.toLocaleString()} · due {formatDate(inv.due_date)} · {inv.status}</option>)}
                          </select>
                          {selectedInvoice && (
                            <div className="autofill-preview">
                              <div className="autofill-row"><span className="autofill-label">Amount</span><span className="autofill-value">${selectedInvoice.amount.toLocaleString()}</span></div>
                              <div className="autofill-row"><span className="autofill-label">Due date</span><span className="autofill-value">{formatDate(selectedInvoice.due_date)}</span></div>
                              <div className="autofill-row"><span className="autofill-label">Days overdue</span><span className="autofill-value" style={{ color: getDaysOverdue(selectedInvoice.due_date) > 0 ? '#f07030' : '#1aad70' }}>{getDaysOverdue(selectedInvoice.due_date) > 0 ? `${getDaysOverdue(selectedInvoice.due_date)} days` : 'Not overdue'}</span></div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {config.extraFields.map(field => (
                    <div key={field.key} className="run-field">
                      <label className="run-label">{field.label}</label>
                      {field.textarea
                        ? <textarea className="run-textarea" placeholder={field.placeholder} value={extraFields[field.key] ?? ''} onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))} />
                        : <input className="run-input" type={field.type ?? 'text'} placeholder={field.placeholder} value={extraFields[field.key] ?? ''} onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))} />
                      }
                    </div>
                  ))}

                  {error && (
                    <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', color: '#d05820', fontSize: 13, padding: '10px 14px', borderRadius: 8 }}>{error}</div>
                  )}

                  <button className="run-btn" onClick={handleRun} disabled={running || !isReady()}>
                    {running ? (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" className="run-btn-spinner"><path d="M21 12a9 9 0 11-6.219-8.56" /></svg>Running...</>
                    ) : config.requiresReview ? (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>Generate draft</>
                    ) : (
                      <><svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 14, height: 14 }}><polygon points="5 3 19 12 5 21 5 3" /></svg>Run agent</>
                    )}
                  </button>

                  {requiresReview && (
                    <div style={{ fontSize: 11, color: '#a89ec8', textAlign: 'center', marginTop: -4 }}>
                      AI drafts the email · you review and approve before it sends
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="panel" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span className="credits-label">Credits</span>
                  <div className="credits-track"><div className="credits-fill" style={{ width: `${creditPct}%` }} /></div>
                  <span className="credits-count">{creditsUsed}/{maxCredits}</span>
                </div>
              </div>

              <div className="panel" style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1530', marginBottom: 12 }}>Send mode</div>
                <div style={{ fontSize: 11, color: '#a89ec8', marginBottom: 10 }}>Toggle to control auto-send vs review</div>
                {(Object.entries(TASK_TYPES) as [TaskType, TaskTypeConfig][]).map(([type, cfg]) => (
                  <div key={type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f2fc' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1530' }}>{cfg.label}</div>
                      <div style={{ fontSize: 11, color: sendModes[type] ? '#f07030' : '#1aad70', fontWeight: 600 }}>
                        {sendModes[type] ? 'Review first' : 'Auto-send'}
                      </div>
                    </div>
                    <label style={{ position: 'relative', width: 36, height: 20, flexShrink: 0, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={sendModes[type]}
                        onChange={() => toggleSendMode(type)}
                        style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                      />
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: 10, cursor: 'pointer',
                        background: sendModes[type] ? '#f07030' : '#1aad70',
                        transition: 'background 0.2s',
                      }}>
                        <div style={{
                          position: 'absolute', width: 14, height: 14, background: '#fff', borderRadius: '50%',
                          top: 3, left: sendModes[type] ? 19 : 3, transition: 'left 0.2s',
                        }} />
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* DRAFTS TAB */}
        {tab === 'drafts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {drafts.length === 0 ? (
              <div className="panel" style={{ textAlign: 'center', padding: '48px 24px', color: '#a89ec8' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1530', marginBottom: 6 }}>All clear</div>
                <div style={{ fontSize: 13 }}>No drafts waiting for review</div>
              </div>
            ) : drafts.map(task => {
              const cfg = TASK_TYPES[task.type as TaskType]
              const output = (task.output as { text: string } | null)?.text ?? ''
              const isExpanded = expandedId === task.id
              const isEditing = editingId === task.id

              return (
                <div key={task.id} className="panel" style={{ borderLeft: '3px solid #f07030' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className={`task-item-icon ti-${cfg?.color ?? 'purple'}`}>{cfg?.icon}</div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1530' }}>{TASK_LABELS[task.type]}</div>
                        <div style={{ fontSize: 12, color: '#a89ec8', marginTop: 2 }}>
                          {timeAgo(task.created_at)} · {Object.values(task.input as Record<string, unknown>)[0] as string}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ece8f5', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#6a6085', fontFamily: 'DM Sans, sans-serif' }}
                        onClick={() => { setExpandedId(isExpanded ? null : task.id); setEditingId(null) }}
                      >
                        {isExpanded ? 'Hide' : 'Preview'}
                      </button>
                      <button
                        style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #ece8f5', background: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', color: '#6c47e8', fontFamily: 'DM Sans, sans-serif' }}
                        onClick={() => { setEditingId(isEditing ? null : task.id); setEditedOutput(output); setExpandedId(task.id) }}
                      >
                        Edit
                      </button>
                      <button
                        style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#fff4ec', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#f07030', fontFamily: 'DM Sans, sans-serif' }}
                        onClick={() => handleReject(task.id)}
                      >
                        Reject
                      </button>
                      <button
                        style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: approvingId === task.id ? '#9b7df5' : '#6c47e8', fontSize: 12, fontWeight: 600, cursor: approvingId === task.id ? 'not-allowed' : 'pointer', color: '#fff', fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', gap: 6, opacity: approvingId === task.id ? 0.8 : 1 }}
                        onClick={() => handleApprove(task.id, isEditing ? editedOutput : output)}
                        disabled={approvingId === task.id}
                      >
                        {approvingId === task.id ? (
                          <>
                            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }}>
                              <path d="M21 12a9 9 0 11-6.219-8.56" />
                            </svg>
                            Sending...
                          </>
                        ) : '✓ Approve & send'}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop: 14 }}>
                      {isEditing ? (
                        <textarea
                          value={editedOutput}
                          onChange={e => setEditedOutput(e.target.value)}
                          style={{ width: '100%', minHeight: 200, border: '1px solid #6c47e8', borderRadius: 10, padding: '12px 14px', fontSize: 13, fontFamily: 'DM Sans, sans-serif', color: '#1a1530', background: '#faf8ff', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                      ) : (
                        <div style={{ background: '#f5f2fc', borderRadius: 10, padding: '14px 16px', fontSize: 13, color: '#4a3a70', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                          {output}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="panel-header" style={{ padding: '14px 16px', borderBottom: '1px solid #f5f2fc' }}>
              <span className="panel-title">Task history</span>
              <span style={{ fontSize: 12, color: '#a89ec8' }}>{history.length} tasks</span>
            </div>
            {tasksLoading ? (
              <div className="task-empty">Loading...</div>
            ) : history.length === 0 ? (
              <div className="task-empty">
                <div className="task-empty-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#b8a0f0" strokeWidth={1.8} strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" /></svg>
                </div>
                No tasks yet
              </div>
            ) : (
              <div className="task-history">
                {history.map(task => {
                  const cfg = TASK_TYPES[task.type as TaskType]
                  const output = (task.output as { text: string } | null)?.text ?? task.error ?? ''
                  return (
                    <div key={task.id} className="task-item" onClick={() => setExpandedId(expandedId === task.id ? null : task.id)} style={{ cursor: 'pointer' }}>
                      <div className="task-item-header">
                        <div className="task-item-left">
                          <div className={`task-item-icon ti-${cfg?.color ?? 'purple'}`}>{cfg?.icon}</div>
                          <div>
                            <div className="task-item-name">{TASK_LABELS[task.type] ?? task.type}</div>
                            <div className="task-item-meta">{timeAgo(task.created_at)} · {Object.values(task.input as Record<string, unknown>)[0] as string}</div>
                          </div>
                        </div>
                        <div className={`task-status-dot dot-${task.status}`} />
                      </div>
                      {expandedId === task.id && output && (
                        <div className="task-item-output">{output}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
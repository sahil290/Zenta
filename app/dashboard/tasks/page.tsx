'use client'

import { useState, useEffect } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useContacts } from '@/hooks/useContacts'
import { useInvoices } from '@/hooks/useInvoices'
import './tasks.css'

type TaskType = 'invoice_chase' | 'lead_followup' | 'client_onboard' | 'invoice_send' | 'proposal_draft' | 'weekly_report' | 'crm_sync'

interface TaskTypeConfig {
  label: string
  desc: string
  color: string
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
    needsContact: true,
    needsInvoice: true,
    extraFields: [],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.55a16 16 0 006.54 6.54l1.62-1.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  },
  lead_followup: {
    label: 'Follow up lead',
    desc: 'Re-engage cold prospect',
    color: 'purple',
    needsContact: true,
    needsInvoice: false,
    extraFields: [
      { key: 'context', label: 'Context / notes', placeholder: 'Interested in web redesign...', textarea: true },
    ],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
  },
  client_onboard: {
    label: 'Onboard client',
    desc: 'Welcome new client',
    color: 'green',
    needsContact: true,
    needsInvoice: false,
    extraFields: [
      { key: 'project_type', label: 'Project type', placeholder: 'E-commerce website' },
    ],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  invoice_send: {
    label: 'Send invoice',
    desc: 'Generate and send invoice',
    color: 'blue',
    needsContact: true,
    needsInvoice: true,
    extraFields: [],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>,
  },
  proposal_draft: {
    label: 'Draft proposal',
    desc: 'Write project proposal',
    color: 'pink',
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
    needsContact: false,
    needsInvoice: false,
    extraFields: [
      { key: 'period', label: 'Period', placeholder: 'Week of March 18, 2025' },
    ],
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
  crm_sync: {
    label: 'CRM sync',
    desc: 'Update contact record',
    color: 'teal',
    needsContact: true,
    needsInvoice: false,
    extraFields: [
      { key: 'notes', label: 'Notes to add', placeholder: 'Called today, interested in Q2 project', textarea: true },
    ],
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

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDaysOverdue(dueDate: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(dueDate).getTime()) / 86400000))
}

export default function TasksPage() {
  const { tasks, loading: tasksLoading, refetch, creditsUsed } = useTasks()
  const { contacts } = useContacts()
  const { invoices } = useInvoices()

  const [selectedType, setSelectedType] = useState<TaskType>('invoice_chase')
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('')
  const [extraFields, setExtraFields] = useState<Record<string, string>>({})
  const [running, setRunning] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const config = TASK_TYPES[selectedType]
  const maxCredits = 1000
  const creditPct = Math.min(100, Math.round((creditsUsed / maxCredits) * 100))

  const selectedContact = contacts.find(c => c.id === selectedContactId)
  const selectedInvoice = invoices.find(i => i.id === selectedInvoiceId)

  // Filter invoices for selected contact
  const contactInvoices = invoices.filter(inv =>
    selectedContactId
      ? inv.contact_id === selectedContactId || inv.contact_name === selectedContact?.name
      : true
  ).filter(inv => inv.status !== 'paid')

  // Reset selections when task type changes
  useEffect(() => {
    setSelectedContactId('')
    setSelectedInvoiceId('')
    setExtraFields({})
    setError('')
  }, [selectedType])

  // Auto-select first invoice when contact is selected for invoice tasks
  useEffect(() => {
    if (selectedContactId && config.needsInvoice && contactInvoices.length === 1) {
      setSelectedInvoiceId(contactInvoices[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedContactId, selectedType])

  // Build the full input object automatically
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

  const handleRun = async () => {
    setRunning(true)
    setError('')
    try {
      const supabase = (await import('@/lib/supabase/client')).createClient()
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ taskType: selectedType, input: buildInput() }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Task failed')
      await refetch()
      setExpandedId(data.taskId)
      setSelectedInvoiceId('')
      setExtraFields({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    }
    setRunning(false)
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Agent tasks</h1>
          <p className="topbar-sub">
            {tasksLoading ? 'Loading...' : `${tasks.filter(t => t.status === 'completed').length} completed · ${creditsUsed} credits used`}
          </p>
        </div>
      </header>

      <div className="page-content">
        <div className="tasks-layout">
          <div className="tasks-run-panel">

            {/* Task type selector */}
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
                  </button>
                ))}
              </div>
            </div>

            {/* Smart form */}
            <div className="panel">
              <div className="panel-header">
                <span className="panel-title">{config.label}</span>
              </div>
              <div className="run-form">

                {/* Contact picker */}
                {config.needsContact && (
                  <div className="run-field">
                    <label className="run-label">Contact</label>
                    <select
                      className="run-input"
                      value={selectedContactId}
                      onChange={e => {
                        setSelectedContactId(e.target.value)
                        setSelectedInvoiceId('')
                      }}
                    >
                      <option value="">— Select a contact —</option>
                      {contacts.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} · {c.email}
                        </option>
                      ))}
                    </select>

                    {/* Auto-filled contact info preview */}
                    {selectedContact && (
                      <div className="autofill-preview">
                        <div className="autofill-row">
                          <span className="autofill-label">Name</span>
                          <span className="autofill-value">{selectedContact.name}</span>
                        </div>
                        <div className="autofill-row">
                          <span className="autofill-label">Email</span>
                          <span className="autofill-value">{selectedContact.email}</span>
                        </div>
                        {selectedContact.company && (
                          <div className="autofill-row">
                            <span className="autofill-label">Company</span>
                            <span className="autofill-value">{selectedContact.company}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice picker */}
                {config.needsInvoice && selectedContactId && (
                  <div className="run-field">
                    <label className="run-label">Invoice</label>
                    {contactInvoices.length === 0 ? (
                      <div className="autofill-preview">
                        <span className="autofill-label">No unpaid invoices found for this contact</span>
                      </div>
                    ) : (
                      <>
                        <select
                          className="run-input"
                          value={selectedInvoiceId}
                          onChange={e => setSelectedInvoiceId(e.target.value)}
                        >
                          <option value="">— Select an invoice —</option>
                          {contactInvoices.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              ${inv.amount.toLocaleString()} · due {formatDate(inv.due_date)} · {inv.status}
                            </option>
                          ))}
                        </select>

                        {/* Auto-filled invoice info preview */}
                        {selectedInvoice && (
                          <div className="autofill-preview">
                            <div className="autofill-row">
                              <span className="autofill-label">Amount</span>
                              <span className="autofill-value">${selectedInvoice.amount.toLocaleString()}</span>
                            </div>
                            <div className="autofill-row">
                              <span className="autofill-label">Due date</span>
                              <span className="autofill-value">{formatDate(selectedInvoice.due_date)}</span>
                            </div>
                            <div className="autofill-row">
                              <span className="autofill-label">Days overdue</span>
                              <span className="autofill-value" style={{ color: getDaysOverdue(selectedInvoice.due_date) > 0 ? '#f07030' : '#1aad70' }}>
                                {getDaysOverdue(selectedInvoice.due_date) > 0 ? `${getDaysOverdue(selectedInvoice.due_date)} days` : 'Not yet overdue'}
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* Extra fields */}
                {config.extraFields.map(field => (
                  <div key={field.key} className="run-field">
                    <label className="run-label">{field.label}</label>
                    {field.textarea ? (
                      <textarea
                        className="run-textarea"
                        placeholder={field.placeholder}
                        value={extraFields[field.key] ?? ''}
                        onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))}
                      />
                    ) : (
                      <input
                        className="run-input"
                        type={field.type ?? 'text'}
                        placeholder={field.placeholder}
                        value={extraFields[field.key] ?? ''}
                        onChange={e => setExtraFields(f => ({ ...f, [field.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}

                {error && (
                  <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', color: '#d05820', fontSize: 13, padding: '10px 14px', borderRadius: 8 }}>
                    {error}
                  </div>
                )}

                <button className="run-btn" onClick={handleRun} disabled={running || !isReady()}>
                  {running ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" className="run-btn-spinner">
                        <path d="M21 12a9 9 0 11-6.219-8.56" />
                      </svg>
                      Agent running...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      Run agent
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right panel — credits + history */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="panel" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="credits-label">Credits</span>
                <div className="credits-track">
                  <div className="credits-fill" style={{ width: `${creditPct}%` }} />
                </div>
                <span className="credits-count">{creditsUsed}/{maxCredits}</span>
              </div>
            </div>

            <div className="panel" style={{ padding: 0, overflow: 'hidden', flex: 1 }}>
              <div className="panel-header" style={{ padding: '14px 16px', borderBottom: '1px solid #f5f2fc' }}>
                <span className="panel-title">Task history</span>
                <span style={{ fontSize: 12, color: '#a89ec8' }}>{tasks.length} tasks</span>
              </div>

              {tasksLoading ? (
                <div className="task-empty">Loading...</div>
              ) : tasks.length === 0 ? (
                <div className="task-empty">
                  <div className="task-empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#b8a0f0" strokeWidth={1.8} strokeLinecap="round">
                      <circle cx="12" cy="12" r="9" /><path d="M12 8v4l2.5 2.5" />
                    </svg>
                  </div>
                  No tasks yet — run your first agent task
                </div>
              ) : (
                <div className="task-history">
                  {tasks.map(task => {
                    const cfg = TASK_TYPES[task.type as TaskType]
                    const output = task.output
                      ? String((task.output as Record<string, unknown>).text ?? '')
                      : task.error ?? ''
                    return (
                      <div
                        key={task.id}
                        className="task-item"
                        onClick={() => setExpandedId(expandedId === task.id ? null : task.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="task-item-header">
                          <div className="task-item-left">
                            <div className={`task-item-icon ti-${cfg?.color ?? 'purple'}`}>
                              {cfg?.icon}
                            </div>
                            <div>
                              <div className="task-item-name">{TASK_LABELS[task.type] ?? task.type}</div>
                              <div className="task-item-meta">
                                {timeAgo(task.created_at)}
                                {task.input && (Object.values(task.input as Record<string, unknown>)[0] as string) && ` · ${Object.values(task.input as Record<string, unknown>)[0]}`}
                              </div>
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
          </div>
        </div>
      </div>
    </>
  )
}
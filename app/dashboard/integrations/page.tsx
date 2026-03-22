'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import './integrations.css'

interface Integration {
  id: string
  name: string
  desc: string
  logo: string
  bg: string
  status: 'available' | 'coming_soon'
  features: string[]
  configFields?: { key: string; label: string; placeholder: string; type?: string }[]
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    desc: 'Send emails directly from your Gmail account so clients see your real address.',
    logo: '📧',
    bg: '#fef2f2',
    status: 'available',
    features: ['Send from your Gmail address', 'Auto-attach invoice PDFs', 'Track email opens'],
    configFields: [
      { key: 'gmail_email', label: 'Gmail address', placeholder: 'you@gmail.com' },
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    desc: 'Get notified in Slack when the agent completes a task, an invoice is paid, or a lead responds.',
    logo: '💬',
    bg: '#f8f0ff',
    status: 'available',
    features: ['Task completion alerts', 'Invoice paid notifications', 'Lead activity updates'],
    configFields: [
      { key: 'slack_webhook', label: 'Incoming Webhook URL', placeholder: 'https://hooks.slack.com/services/...' },
      { key: 'slack_channel', label: 'Channel (optional)', placeholder: '#zenta-alerts' },
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    desc: 'Automatically log completed tasks, new contacts and paid invoices to your Notion workspace.',
    logo: '📝',
    bg: '#f5f5f0',
    status: 'available',
    features: ['Log tasks to Notion DB', 'Sync contacts automatically', 'Invoice tracker page'],
    configFields: [
      { key: 'notion_token', label: 'Integration token', placeholder: 'secret_...' },
      { key: 'notion_db', label: 'Database ID', placeholder: 'Paste your Notion DB ID' },
    ],
  },
  {
    id: 'zapier',
    name: 'Zapier',
    desc: 'Connect Zenta to 5,000+ apps. Trigger zaps on task completed, invoice paid, and more.',
    logo: '⚡',
    bg: '#fff8f0',
    status: 'available',
    features: ['5,000+ app connections', 'Custom trigger events', 'No-code automation'],
    configFields: [
      { key: 'zapier_webhook', label: 'Zapier Webhook URL', placeholder: 'https://hooks.zapier.com/...' },
    ],
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    desc: 'Send invoice reminders and follow-ups via WhatsApp Business API.',
    logo: '📱',
    bg: '#f0fff4',
    status: 'coming_soon',
    features: ['WhatsApp invoice reminders', 'Lead follow-up via chat', '95% open rate vs email'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    desc: 'Add a payment link to every invoice. Clients pay instantly.',
    logo: '💳',
    bg: '#f0f4ff',
    status: 'coming_soon',
    features: ['Instant payment links', 'Auto mark paid on payment', 'Revenue reconciliation'],
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    desc: 'Two-way sync contacts and deals between Zenta and HubSpot CRM.',
    logo: '🔶',
    bg: '#fff8f0',
    status: 'coming_soon',
    features: ['Bi-directional contact sync', 'Deal pipeline updates', 'Activity logging'],
  },
  {
    id: 'calendly',
    name: 'Calendly',
    desc: 'Auto-include your Calendly link in follow-up emails.',
    logo: '📅',
    bg: '#f0f8ff',
    status: 'coming_soon',
    features: ['Auto-attach booking link', 'Meeting booked notifications', 'Follow-up on no-shows'],
  },
]

export default function IntegrationsPage() {
  const [connected, setConnected] = useState<Record<string, Record<string, string>>>({})
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const supabase = createClient()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3500)
  }

  // Check URL params for OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'gmail') {
      showToast('Gmail connected successfully')
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
    if (params.get('error')) {
      showToast('Connection failed — ' + (params.get('error') ?? '').replace(/_/g, ' '))
      window.history.replaceState({}, '', '/dashboard/integrations')
    }
  }, [])

  // Load saved integrations from Supabase
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', user.id)
      if (data) {
        const map: Record<string, Record<string, string>> = {}
        data.forEach((row: { type: string; config: Record<string, string> }) => {
          map[row.type] = row.config ?? {}
        })
        setConnected(map)
      }
    }
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async (integration: Integration) => {
    if (integration.id === 'gmail') {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      window.location.href = `/api/integrations/gmail?userId=${user.id}`
      return
    }
    setConfiguring(integration.id)
    setConfigValues(connected[integration.id] ?? {})
  }

  const handleSave = async (integration: Integration) => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      showToast('Not logged in — please refresh')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('integrations').upsert({
      user_id: user.id,
      type: integration.id,
      config: configValues,
      status: 'active',
    } as Record<string, unknown>, { onConflict: 'user_id,type' })

    if (error) {
      showToast(`Save failed: ${error.message}`)
      setSaving(false)
      return
    }

    setConnected(prev => ({ ...prev, [integration.id]: configValues }))
    setConfiguring(null)
    setSaving(false)
    showToast(`${integration.name} connected successfully`)
  }

  const handleDisconnect = async (integrationId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('type', integrationId)
    setConnected(prev => {
      const next = { ...prev }
      delete next[integrationId]
      return next
    })
    showToast('Integration disconnected')
  }

  const handleTest = async (integration: Integration) => {
    if (!connected[integration.id]) return
    showToast(`Testing ${integration.name}...`)
    try {
      const res = await fetch('/api/integrations/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: integration.id, config: connected[integration.id] }),
      })
      const data = await res.json()
      showToast(res.ok ? `✓ ${data.message}` : `✗ ${data.error}`)
    } catch {
      showToast('Test failed — check your connection')
    }
  }

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhook/zenta`)
    showToast('Webhook URL copied')
  }

  const available = INTEGRATIONS.filter(i => i.status === 'available')
  const comingSoon = INTEGRATIONS.filter(i => i.status === 'coming_soon')
  const connectedCount = Object.keys(connected).length

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Integrations</h1>
          <p className="topbar-sub">
            {connectedCount === 0
              ? 'Connect your tools to supercharge the agent'
              : `${connectedCount} integration${connectedCount > 1 ? 's' : ''} connected`}
          </p>
        </div>
      </header>

      <div className="page-content">
        <div className="integrations-section-title">Available now</div>
        <div className="integrations-grid">
          {available.map(integration => {
            const isConnected = !!connected[integration.id]
            const isConfiguring = configuring === integration.id

            return (
              <div key={integration.id} className={`integration-card${isConnected ? ' connected' : ''}`}>
                <div className="integration-header">
                  <div className="integration-logo" style={{ background: integration.bg }}>
                    {integration.logo}
                  </div>
                  <span className={`integration-status ${isConnected ? 'status-connected' : 'status-available'}`}>
                    {isConnected ? '● Connected' : 'Available'}
                  </span>
                </div>

                <div>
                  <div className="integration-name">{integration.name}</div>
                  <div className="integration-desc">{integration.desc}</div>
                </div>

                <div className="integration-features">
                  {integration.features.map(f => (
                    <div key={f} className="integration-feature">
                      <div className={`integration-feature-dot${isConnected ? ' active' : ''}`} />
                      {f}
                    </div>
                  ))}
                </div>

                {isConfiguring && integration.configFields && (
                  <div className="integration-config">
                    <div className="integration-config-title">Configure {integration.name}</div>
                    {integration.configFields.map(field => (
                      <div key={field.key}>
                        <div style={{ fontSize: 11, color: '#6a6085', marginBottom: 4 }}>{field.label}</div>
                        <input
                          className="integration-config-input"
                          type={field.type ?? 'text'}
                          placeholder={field.placeholder}
                          value={configValues[field.key] ?? ''}
                          onChange={e => setConfigValues(v => ({ ...v, [field.key]: e.target.value }))}
                        />
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button className="btn-ghost" style={{ flex: 1, height: 34, fontSize: 12 }} onClick={() => setConfiguring(null)}>
                        Cancel
                      </button>
                      <button className="btn-primary" style={{ flex: 2, height: 34, fontSize: 12 }} onClick={() => handleSave(integration)} disabled={saving}>
                        {saving ? 'Saving...' : 'Save & connect'}
                      </button>
                    </div>
                  </div>
                )}

                {!isConfiguring && (
                  isConnected ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn-connect btn-connect-primary"
                        style={{ flex: 1, background: '#f0edf8', color: '#6c47e8', border: 'none' }}
                        onClick={() => handleTest(integration)}
                      >
                        Test
                      </button>
                      <button
                        className="btn-connect btn-connect-disconnect"
                        style={{ flex: 1 }}
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : (
                    <button className="btn-connect btn-connect-primary" onClick={() => handleConnect(integration)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 13, height: 13 }}>
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      Connect {integration.name}
                    </button>
                  )
                )}
              </div>
            )
          })}
        </div>

        <div className="webhook-card" style={{ marginBottom: 20 }}>
          <div className="panel-header" style={{ marginBottom: 8 }}>
            <span className="panel-title">Zenta webhook</span>
            <span className="tag tag-purple">Universal</span>
          </div>
          <p style={{ fontSize: 13, color: '#6a6085', marginBottom: 8 }}>
            Use this URL to receive real-time events in any tool — Zapier, Make, n8n, or your own server.
          </p>
          <div className="webhook-url">
            <span>{typeof window !== 'undefined' ? window.location.origin : 'https://your-app.vercel.app'}/api/webhook/zenta</span>
            <button className="copy-btn" onClick={handleCopyWebhook} title="Copy">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#a89ec8' }}>Events: task.completed · invoice.paid · contact.added · lead.responded</div>
        </div>

        <div className="integrations-section-title">Coming soon</div>
        <div className="integrations-grid">
          {comingSoon.map(integration => (
            <div key={integration.id} className="integration-card coming-soon">
              <div className="integration-header">
                <div className="integration-logo" style={{ background: integration.bg }}>{integration.logo}</div>
                <span className="integration-status status-soon">Coming soon</span>
              </div>
              <div>
                <div className="integration-name">{integration.name}</div>
                <div className="integration-desc">{integration.desc}</div>
              </div>
              <div className="integration-features">
                {integration.features.map(f => (
                  <div key={f} className="integration-feature">
                    <div className="integration-feature-dot" />{f}
                  </div>
                ))}
              </div>
              <button className="btn-connect btn-connect-soon">Coming soon</button>
            </div>
          ))}
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1530', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 100, fontFamily: 'DM Sans, sans-serif' }}>
          {toast}
        </div>
      )}
    </>
  )
}
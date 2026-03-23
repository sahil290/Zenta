'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTasks } from '@/hooks/useTasks'
import { useContacts } from '@/hooks/useContacts'
import { useInvoices } from '@/hooks/useInvoices'
import './billing.css'

const PLANS = [
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    priceNum: 49,
    period: '/month',
    trial: '14-day free trial',
    description: 'Perfect for freelancers and solo consultants',
    features: [
      '1,000 agent tasks/month',
      '5,000 contacts',
      'All 7 agent automations',
      'Invoice chasing + sending',
      'Lead follow-up sequences',
      'PDF invoice exports',
      'Email support',
    ],
    color: 'purple',
    featured: false,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: '$99',
    priceNum: 99,
    period: '/month',
    trial: '14-day free trial',
    description: 'For agencies and teams managing multiple clients',
    features: [
      'Unlimited agent tasks',
      'Unlimited contacts',
      'Everything in Pro',
      'Team collaboration',
      'White-label option',
      'Priority support',
      'Custom integrations',
    ],
    color: 'gradient',
    featured: true,
  },
]

const MOCK_HISTORY = [
  { date: 'Mar 1, 2025', desc: 'Pro plan — monthly', amount: '$49.00' },
  { date: 'Feb 1, 2025', desc: 'Pro plan — monthly', amount: '$49.00' },
  { date: 'Jan 1, 2025', desc: 'Pro plan — monthly', amount: '$49.00' },
]

declare global {
  interface Window {
    Razorpay: new (options: object) => { open: () => void }
  }
}

export default function BillingPage() {
  const [currentPlan, setCurrentPlan] = useState('free')
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPlan, setProcessingPlan] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const { creditsUsed } = useTasks()
  const { contacts } = useContacts()
  const { invoices } = useInvoices()
  const supabase = createClient()

  useEffect(() => {
    const fetchPlan = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('subscriptions')
        .select('plan, status, current_period_end, created_at')
        .eq('user_id', user.id)
        .limit(1)
      const sub = (data ?? [])[0] as { plan: string; status: string; current_period_end: string | null } | null
      if (sub) {
        setCurrentPlan(sub.plan)
        if (sub.status === 'trialing' && sub.current_period_end) {
          const daysLeft = Math.ceil((new Date(sub.current_period_end).getTime() - Date.now()) / 86400000)
          setTrialDaysLeft(daysLeft)
        }
      }
      setLoading(false)
    }
    fetchPlan()
  }, [supabase])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 4000)
  }

  const loadRazorpay = () => new Promise<boolean>(resolve => {
    if (window.Razorpay) { resolve(true); return }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  const handleUpgrade = async (planId: string) => {
    setProcessingPlan(planId)

    const loaded = await loadRazorpay()
    if (!loaded) {
      showToast('Failed to load payment gateway — check your connection')
      setProcessingPlan(null)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const userId = session?.user?.id

      const res = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ planId }),
      })

      const order = await res.json()
      if (!res.ok) throw new Error(order.error)

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Zenta',
        description: planId === 'pro' ? 'Pro Plan — $49/month' : 'Agency Plan — $99/month',
        order_id: order.orderId,
        prefill: {
          email: session?.user?.email ?? '',
        },
        theme: { color: '#6c47e8' },
        handler: async (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const verifyRes = await fetch('/api/razorpay/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId,
              planId,
            }),
          })

          const result = await verifyRes.json()
          if (result.success) {
            setCurrentPlan(planId)
            showToast(`🎉 Welcome to ${planId === 'pro' ? 'Pro' : 'Agency'}! Your plan is now active.`)
          } else {
            showToast('Payment verification failed — please contact support')
          }
        },
        modal: {
          ondismiss: () => setProcessingPlan(null),
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Payment failed')
    }

    setProcessingPlan(null)
  }

  const handleStartTrial = async (planId: string) => {
    setProcessingPlan(planId)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    await supabase.from('subscriptions').delete().eq('user_id', user.id)
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: planId,
      status: 'trialing',
      current_period_end: trialEnd,
    })

    setCurrentPlan(planId)
    setTrialDaysLeft(14)
    setProcessingPlan(null)
    showToast(`14-day free trial started! No card required.`)
  }

  const planLimits = { free: { tasks: 10, contacts: 25 }, pro: { tasks: 1000, contacts: 5000 }, agency: { tasks: 9999, contacts: 99999 } }
  const limits = planLimits[currentPlan as keyof typeof planLimits] ?? planLimits.free
  const taskPct = Math.min(100, Math.round((creditsUsed / limits.tasks) * 100))
  const contactPct = Math.min(100, Math.round((contacts.length / Math.min(limits.contacts, 5000)) * 100))

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Billing</h1>
          <p className="topbar-sub">
            {loading ? 'Loading...' : currentPlan === 'free'
              ? 'You are on the free plan — upgrade to unlock full access'
              : trialDaysLeft !== null
                ? `${trialDaysLeft} days left in your free trial`
                : `${currentPlan === 'pro' ? 'Pro' : 'Agency'} plan — active`
            }
          </p>
        </div>
      </header>

      <div className="page-content">

        {/* Trial / current plan banner */}
        {trialDaysLeft !== null && trialDaysLeft <= 7 && (
          <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', borderRadius: 12, padding: '14px 18px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#d05820' }}>Trial ending in {trialDaysLeft} days</div>
              <div style={{ fontSize: 12, color: '#b07050', marginTop: 2 }}>Add payment to keep your plan active</div>
            </div>
            <button className="btn-primary" onClick={() => handleUpgrade(currentPlan)} style={{ fontSize: 13 }}>
              Add payment
            </button>
          </div>
        )}

        {/* Plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {PLANS.map(plan => {
            const isCurrent = currentPlan === plan.id
            const isTrialing = isCurrent && trialDaysLeft !== null
            return (
              <div key={plan.id} className={`plan-card${isCurrent ? ' current' : ''}`} style={plan.featured ? { borderColor: '#6c47e8' } : {}}>
                {isCurrent && <div className="plan-current-badge">{isTrialing ? `Trial · ${trialDaysLeft}d left` : 'Current plan'}</div>}
                {plan.featured && !isCurrent && (
                  <div className="plan-current-badge" style={{ background: '#1aad70' }}>Most popular</div>
                )}

                <div className="plan-name">{plan.name}</div>
                <div className="plan-price">{plan.price}<span> / mo</span></div>
                <div className="plan-period" style={{ color: '#6c47e8', fontWeight: 500 }}>{plan.trial}</div>
                <div style={{ fontSize: 12, color: '#a89ec8', marginBottom: 16, fontWeight: 300 }}>{plan.description}</div>

                <div className="plan-divider" />

                <div className="plan-features">
                  {plan.features.map(f => (
                    <div key={f} className="plan-feature">
                      <div className="plan-check">✓</div>
                      {f}
                    </div>
                  ))}
                </div>

                {isCurrent && !isTrialing ? (
                  <button className="btn-upgrade btn-upgrade-disabled">Current plan</button>
                ) : isTrialing ? (
                  <button
                    className="btn-upgrade btn-upgrade-primary"
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? 'Processing...' : `Pay ${plan.price}/mo`}
                  </button>
                ) : (
                  <button
                    className="btn-upgrade btn-upgrade-primary"
                    onClick={() => handleStartTrial(plan.id)}
                    disabled={processingPlan === plan.id}
                  >
                    {processingPlan === plan.id ? 'Starting...' : 'Start free trial'}
                  </button>
                )}

                {!isCurrent && !isTrialing && (
                  <div style={{ textAlign: 'center', fontSize: 11, color: '#a89ec8', marginTop: 8 }}>
                    No credit card required for trial
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="billing-grid">
          {/* Usage */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">This month&apos;s usage</span>
              <span style={{ fontSize: 12, color: '#a89ec8' }}>
                {currentPlan === 'free' ? 'Free plan limits' : `${currentPlan === 'pro' ? 'Pro' : 'Agency'} plan`}
              </span>
            </div>
            <div className="usage-row">
              <span className="usage-label">Agent tasks</span>
              <div className="usage-track">
                <div className="usage-fill usage-fill-purple" style={{ width: `${taskPct}%` }} />
              </div>
              <span className="usage-count" style={{ color: taskPct > 80 ? '#f07030' : '#a89ec8' }}>
                {creditsUsed} / {limits.tasks === 9999 ? '∞' : limits.tasks}
              </span>
            </div>
            <div className="usage-row">
              <span className="usage-label">Contacts</span>
              <div className="usage-track">
                <div className="usage-fill usage-fill-green" style={{ width: `${contactPct}%` }} />
              </div>
              <span className="usage-count" style={{ color: contactPct > 80 ? '#f07030' : '#a89ec8' }}>
                {contacts.length} / {limits.contacts === 99999 ? '∞' : limits.contacts}
              </span>
            </div>
            <div className="usage-row">
              <span className="usage-label">Invoices</span>
              <div className="usage-track">
                <div className="usage-fill usage-fill-orange" style={{ width: Math.min(100, Math.round(invoices.length / 10 * 100)) + '%' }} />
              </div>
              <span className="usage-count">{invoices.length} total</span>
            </div>
          </div>

          {/* Billing info */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-title">Billing details</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6a6085' }}>Current plan</span>
                <span style={{ fontWeight: 600, color: '#1a1530', textTransform: 'capitalize' }}>{currentPlan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6a6085' }}>Status</span>
                <span className={`tag ${trialDaysLeft !== null ? 'tag-orange' : currentPlan === 'free' ? 'tag-purple' : 'tag-green'}`}>
                  {trialDaysLeft !== null ? 'Trial' : currentPlan === 'free' ? 'Free' : 'Active'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6a6085' }}>Next billing</span>
                <span style={{ color: '#1a1530' }}>
                  {currentPlan === 'free' ? 'No charge' : trialDaysLeft !== null ? `After trial (${trialDaysLeft}d)` : 'Monthly'}
                </span>
              </div>
              <div style={{ height: 1, background: '#f0edf8' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: '#6a6085' }}>Monthly amount</span>
                <span style={{ fontWeight: 700, color: '#1a1530', fontSize: 16 }}>
                  {currentPlan === 'free' ? '$0' : currentPlan === 'pro' ? '$49' : '$99'}
                </span>
              </div>
              {currentPlan !== 'free' && trialDaysLeft === null && (
                <button
                  className="btn-upgrade btn-upgrade-ghost"
                  style={{ marginTop: 4 }}
                  onClick={() => showToast('To cancel, please contact support@zenta.app')}
                >
                  Cancel subscription
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Payment history */}
        <div className="panel" style={{ padding: 0, overflow: 'hidden', marginTop: 16 }}>
          <div className="panel-header" style={{ padding: '16px 18px', borderBottom: '1px solid #f5f2fc' }}>
            <span className="panel-title">Payment history</span>
          </div>
          {currentPlan === 'free' ? (
            <div className="billing-empty">No payments yet</div>
          ) : (
            MOCK_HISTORY.map((h, i) => (
              <div key={i} className="billing-history-row">
                <span className="billing-date">{h.date}</span>
                <span className="billing-desc">{h.desc}</span>
                <span className="billing-amount">{h.amount}</span>
                <span className="tag tag-green" style={{ marginLeft: 12 }}>Paid</span>
              </div>
            ))
          )}
        </div>
      </div>

      {toast && (
        <div className="chase-toast" style={{ position: 'fixed', bottom: 24, right: 24, background: '#1a1530', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 500, zIndex: 100 }}>
          {toast}
        </div>
      )}
    </>
  )
}
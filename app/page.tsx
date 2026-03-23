import Link from 'next/link'
import './landing.css'

const FEATURES = [
  {
    color: 'purple',
    title: 'AI drafts, you approve',
    desc: 'Every client-facing email gets drafted by AI and sits in your review queue. Tweak the tone, hit approve, it sends. You stay in control — without doing the work.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  },
  {
    color: 'orange',
    title: 'Invoice chasing on autopilot',
    desc: 'Zenta notices overdue invoices and sends firm, professional follow-ups automatically. No more awkward "just checking in" emails — handled.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.55a16 16 0 006.54 6.54l1.62-1.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  },
  {
    color: 'green',
    title: 'Lead follow-up sequences',
    desc: 'Cold leads get personalized re-engagement emails. Zenta tracks every touchpoint so no deal slips through because you forgot to follow up.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
  },
  {
    color: 'blue',
    title: 'Client onboarding in seconds',
    desc: 'New client signed? Zenta sends a professional welcome email instantly. First impression sorted — without you lifting a finger.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  {
    color: 'pink',
    title: 'Proposals in 10 seconds',
    desc: 'Describe the project. Zenta writes a full, professional proposal ready to send. Stop spending hours on docs that should take minutes.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>,
  },
  {
    color: 'teal',
    title: 'Weekly business reports',
    desc: 'Every Monday, Zenta emails you a real summary — revenue, pipeline, overdue invoices, tasks done. Actual data from your account, not generic advice.',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
]

const PLANS = [
  {
    name: 'Pro',
    price: '$49',
    period: '/month',
    trial: '14-day free trial',
    features: ['1,000 agent tasks/month', '5,000 contacts', 'All automations', 'Draft approval queue', 'Slack + Notion + Zapier', 'Email support'],
    cta: 'Start free trial',
    featured: false,
  },
  {
    name: 'Agency',
    price: '$99',
    period: '/month',
    trial: '14-day free trial',
    features: ['Unlimited agent tasks', 'Unlimited contacts', 'Everything in Pro', 'Team collaboration', 'Priority support', 'White-label option'],
    cta: 'Start free trial',
    featured: true,
  },
]

const COMPARISONS = [
  { label: 'Acts without being told', zenta: true, others: false },
  { label: 'Draft approval queue', zenta: true, others: false },
  { label: 'Real weekly reports', zenta: true, others: false },
  { label: 'Slack / Notion / Zapier', zenta: true, others: false },
  { label: 'Invoice chasing', zenta: true, others: '⚠ Manual rules' },
  { label: 'Lead follow-up', zenta: true, others: '⚠ Manual rules' },
]

export default function LandingPage() {
  return (
    <div className="landing">
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-logo-icon"><span>Z</span></div>
          <span className="nav-logo-text">Zenta</span>
        </div>
        <div className="nav-links">
          <a href="#problem" className="nav-link">Why Zenta</a>
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <div className="nav-actions">
          <Link href="/auth/login" className="btn-nav-ghost">Sign in</Link>
          <Link href="/auth/signup" className="btn-nav-primary">Try free for 14 days</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          For early-stage founders & small teams
        </div>
        <h1 className="hero-title">
          AI that does the work.<br />
          <span>You make the final call.</span>
        </h1>
        <p className="hero-sub">
          Zenta handles your ops — chasing invoices, following up leads, onboarding clients, writing proposals. Everything goes through a review queue so nothing sends without your approval.
        </p>
        <div className="hero-actions">
          <Link href="/auth/signup" className="btn-hero-primary">
            Start free trial — no card needed
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 14, height: 14 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/auth/login" className="btn-hero-ghost">Sign in</Link>
        </div>
        <p className="hero-note">14 days free · No credit card · Cancel anytime</p>
      </section>

      {/* Problem section */}
      <section style={{ background: '#fff', borderTop: '1px solid #ece8f5', borderBottom: '1px solid #ece8f5', padding: '72px 24px' }} id="problem">
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 className="features-title">You're building a product and running a business at the same time</h2>
            <p className="features-sub" style={{ maxWidth: 600, margin: '0 auto' }}>
              That means chasing invoices, following up leads, onboarding clients, writing proposals — while also shipping features. Most tools just store your data. Zenta actually does the work.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#f07030', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Without Zenta</div>
              {['Manually chase every overdue invoice', 'Forget to follow up with cold leads', 'Spend hours writing proposals', 'Clients wait days for an onboarding email', 'No idea how your business is doing week to week'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 13, color: '#7a4a2a' }}>
                  <span style={{ color: '#f07030', fontWeight: 700, flexShrink: 0 }}>✗</span>{p}
                </div>
              ))}
            </div>
            <div style={{ background: '#e6f9f0', border: '1px solid #a0d8b8', borderRadius: 16, padding: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#1aad70', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>With Zenta</div>
              {['Agent drafts chase email, you approve in one click', 'Follow-ups drafted automatically, ready to review', 'Proposal written in 10 seconds from a description', 'Welcome email sent the moment client is added', 'Weekly report in your inbox every Monday'].map(p => (
                <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, fontSize: 13, color: '#0a5a38' }}>
                  <span style={{ color: '#1aad70', fontWeight: 700, flexShrink: 0 }}>✓</span>{p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features" id="features">
        <h2 className="features-title">Everything your ops person would do</h2>
        <p className="features-sub">Six automations that save founders 10+ hours every week</p>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card">
              <div className={`feature-icon fi-${f.color}`}>{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section style={{ background: '#fff', borderTop: '1px solid #ece8f5', padding: '72px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 className="features-title" style={{ marginBottom: 8 }}>Not another passive CRM</h2>
          <p className="features-sub" style={{ marginBottom: 40 }}>HubSpot, Pipedrive and HoneyBook store your data and wait. Zenta acts.</p>
          <div style={{ background: '#fff', border: '1px solid #ece8f5', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', background: '#f5f2fc', padding: '12px 20px', fontSize: 12, fontWeight: 700, color: '#6a6085', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <span>Feature</span>
              <span style={{ textAlign: 'center', color: '#6c47e8' }}>Zenta</span>
              <span style={{ textAlign: 'center' }}>Others</span>
            </div>
            {COMPARISONS.map((row, i) => (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', padding: '14px 20px', borderBottom: i < COMPARISONS.length - 1 ? '1px solid #f5f2fc' : 'none', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#1a1530', fontWeight: 500 }}>{row.label}</span>
                <span style={{ textAlign: 'center', fontSize: 14, color: '#1aad70', fontWeight: 700 }}>{row.zenta ? '✓' : '✗'}</span>
                <span style={{ textAlign: 'center', fontSize: typeof row.others === 'string' ? 11 : 14, color: row.others === false ? '#f07030' : '#a89ec8', fontWeight: row.others === false ? 700 : 500 }}>
                  {row.others === false ? '✗' : row.others === true ? '✓' : row.others}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <h2 className="pricing-title">Simple pricing</h2>
          <p className="pricing-sub">14-day free trial on every plan. No credit card required.</p>
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
                {plan.featured && <div className="pricing-popular">Most popular</div>}
                <div className="pricing-plan">{plan.name}</div>
                <div className="pricing-price">{plan.price}<span> USD</span></div>
                <div className="pricing-period">{plan.period}</div>
                <div style={{ fontSize: 12, color: '#6c47e8', fontWeight: 600, marginBottom: 16 }}>{plan.trial}</div>
                <div className="pricing-divider" />
                <div className="pricing-features">
                  {plan.features.map(f => (
                    <div key={f} className="pricing-feature">
                      <div className="pricing-check">✓</div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link href="/auth/signup" className={`btn-pricing ${plan.featured ? 'btn-pricing-primary' : 'btn-pricing-ghost'}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#a89ec8' }}>
            Questions? Email us at <a href="mailto:hello@zenta.app" style={{ color: '#6c47e8' }}>hello@zenta.app</a>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ background: 'linear-gradient(135deg, #6c47e8, #9b7df5)', padding: '72px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, color: '#fff', letterSpacing: -1, marginBottom: 12 }}>
          Stop doing ops. Start building.
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, fontWeight: 300 }}>
          Join founders using Zenta to reclaim 10+ hours a week.
        </p>
        <Link href="/auth/signup" style={{ background: '#fff', color: '#6c47e8', padding: '14px 32px', borderRadius: 12, fontSize: 15, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Start your free trial
          <svg viewBox="0 0 24 24" fill="none" stroke="#6c47e8" strokeWidth={2.5} strokeLinecap="round" style={{ width: 14, height: 14 }}>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <p style={{ marginTop: 16, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>No credit card · 14 days free · Cancel anytime</p>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <div className="footer-logo-icon"><span>Z</span></div>
          <span className="footer-logo-text">Zenta</span>
        </div>
        <p className="footer-tagline">AI business agent for early-stage founders</p>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#pricing" className="footer-link">Pricing</a>
          <Link href="/auth/login" className="footer-link">Sign in</Link>
          <Link href="/auth/signup" className="footer-link">Sign up</Link>
          <a href="mailto:hello@zenta.app" className="footer-link">Contact</a>
        </div>
        <p className="footer-copy">© 2025 Zenta. Built with AI.</p>
      </footer>
    </div>
  )
}
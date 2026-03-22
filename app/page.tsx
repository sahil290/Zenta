import Link from 'next/link'
import './landing.css'

const FEATURES = [
  {
    color: 'purple',
    title: 'Auto invoice chasing',
    desc: 'Zenta notices overdue invoices and sends firm, professional follow-ups automatically — no manual work.',
    icon: <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.2 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.55a16 16 0 006.54 6.54l1.62-1.54a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" /></svg>,
  },
  {
    color: 'green',
    title: 'Lead follow-up sequences',
    desc: 'Cold leads get personalized re-engagement emails. Zenta tracks every touchpoint and acts at the right moment.',
    icon: <svg viewBox="0 0 24 24"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg>,
  },
  {
    color: 'orange',
    title: 'Client onboarding',
    desc: 'New client signed? Zenta sends a welcome email, sets up their profile, and kicks off the onboarding flow.',
    icon: <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>,
  },
  {
    color: 'blue',
    title: 'Proposal drafting',
    desc: 'Describe the project and Zenta writes a professional, branded proposal ready to send in seconds.',
    icon: <svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>,
  },
  {
    color: 'pink',
    title: 'Invoice management',
    desc: 'Create, send and track invoices in one place. See what\'s paid, what\'s outstanding, and what\'s overdue.',
    icon: <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8" /></svg>,
  },
  {
    color: 'teal',
    title: 'Weekly business reports',
    desc: 'Every week Zenta summarises your revenue, pipeline, completed tasks and priorities — automatically.',
    icon: <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$49',
    period: '/month',
    features: ['200 agent tasks/month', '500 contacts', '3 integrations', 'Email support'],
    cta: 'Get started',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$99',
    period: '/month',
    features: ['1,000 agent tasks/month', '5,000 contacts', '10 integrations', 'Priority support', 'PDF invoice exports'],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Agency',
    price: '$199',
    period: '/month',
    features: ['Unlimited tasks', 'Unlimited contacts', 'All integrations', 'Dedicated support', 'White-label option'],
    cta: 'Get started',
    featured: false,
  },
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
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
        </div>
        <div className="nav-actions">
          <Link href="/auth/login" className="btn-nav-ghost">Sign in</Link>
          <Link href="/auth/signup" className="btn-nav-primary">Get started free</Link>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-badge">
          <div className="hero-badge-dot" />
          AI-powered business automation
        </div>
        <h1 className="hero-title">
          Your business runs itself.<br />
          <span>You just do the work.</span>
        </h1>
        <p className="hero-sub">
          Zenta is an AI agent that handles invoicing, lead follow-ups, client onboarding and proposals — automatically, while you focus on what you do best.
        </p>
        <div className="hero-actions">
          <Link href="/auth/signup" className="btn-hero-primary">
            Start for free
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 14, height: 14 }}>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/auth/login" className="btn-hero-ghost">Sign in</Link>
        </div>
        <p className="hero-note">Free plan available · No credit card required</p>
      </section>

      <section className="features" id="features">
        <h2 className="features-title">Everything handled automatically</h2>
        <p className="features-sub">Six powerful automations that save freelancers 10+ hours every week</p>
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

      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <h2 className="pricing-title">Simple, honest pricing</h2>
          <p className="pricing-sub">Start free. Upgrade when you need more.</p>
          <div className="pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} className={`pricing-card${plan.featured ? ' featured' : ''}`}>
                {plan.featured && <div className="pricing-popular">Most popular</div>}
                <div className="pricing-plan">{plan.name}</div>
                <div className="pricing-price">{plan.price}<span> USD</span></div>
                <div className="pricing-period">per month</div>
                <div className="pricing-divider" />
                <div className="pricing-features">
                  {plan.features.map(f => (
                    <div key={f} className="pricing-feature">
                      <div className="pricing-check">✓</div>
                      {f}
                    </div>
                  ))}
                </div>
                <Link
                  href="/auth/signup"
                  className={`btn-pricing ${plan.featured ? 'btn-pricing-primary' : 'btn-pricing-ghost'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-logo">
          <div className="footer-logo-icon"><span>Z</span></div>
          <span className="footer-logo-text">Zenta</span>
        </div>
        <p className="footer-tagline">AI business agent for freelancers and agencies</p>
        <div className="footer-links">
          <a href="#features" className="footer-link">Features</a>
          <a href="#pricing" className="footer-link">Pricing</a>
          <Link href="/auth/login" className="footer-link">Sign in</Link>
          <Link href="/auth/signup" className="footer-link">Sign up</Link>
        </div>
        <p className="footer-copy">© 2025 Zenta. Built with AI.</p>
      </footer>
    </div>
  )
}
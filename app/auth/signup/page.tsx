'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import '../auth.css'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSuccess(true)
    setLoading(false)
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"><span>Z</span></div>
          <span className="auth-brand-name">Zenta</span>
        </div>
        <div className="auth-tagline">
          <h1>Set up in minutes.<br />Save hours every week.</h1>
          <p>Join freelancers and agencies who have automated their business ops with Zenta.</p>
        </div>
        <div className="auth-features">
          {['Auto invoice chasing', 'Lead follow-up sequences', 'Client onboarding flows', 'Weekly business reports'].map(f => (
            <div key={f} className="auth-feature">
              <div className="auth-feature-dot" />
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Create your account</h2>
          <p className="auth-subtitle">Free forever. No credit card needed.</p>

          {success ? (
            <div className="auth-success">
              <div className="auth-success-title">Check your email</div>
              <div className="auth-success-body">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </div>
            </div>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}

              <form onSubmit={handleSignup} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Full name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="James Davidson"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Work email</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="auth-field">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    minLength={8}
                    required
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading
                    ? <span className="auth-btn-loading">
                        <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" className="auth-spinner">
                          <path d="M21 12a9 9 0 11-6.219-8.56" />
                        </svg>
                        Creating account...
                      </span>
                    : 'Create free account'
                  }
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>

              <button className="auth-btn-google" onClick={handleGoogle}>
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <p className="auth-terms">
                By signing up you agree to our <a href="#">Terms</a> and <a href="#">Privacy Policy</a>.
              </p>
            </>
          )}

          <p className="auth-switch">
            Already have an account? <Link href="/auth/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
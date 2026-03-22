'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import '../auth.css'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"><span>Z</span></div>
          <span className="auth-brand-name">Zenta</span>
        </div>
        <div className="auth-tagline">
          <h1>Reset your password</h1>
          <p>Enter your email and we will send you a reset link.</p>
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <h2 className="auth-title">Forgot password?</h2>
          <p className="auth-subtitle">We will email you a reset link</p>

          {sent ? (
            <div className="auth-success">
              <div className="auth-success-title">Check your email</div>
              <div className="auth-success-body">
                Sent a reset link to <strong>{email}</strong>
              </div>
            </div>
          ) : (
            <>
              {error && <div className="auth-error">{error}</div>}
              <form onSubmit={handleReset} className="auth-form">
                <div className="auth-field">
                  <label className="auth-label">Email</label>
                  <input
                    type="email"
                    className="auth-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>
            </>
          )}

          <p className="auth-switch">
            <Link href="/auth/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
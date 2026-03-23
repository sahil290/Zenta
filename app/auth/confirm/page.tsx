'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const supabase = createClient()

  useEffect(() => {
    const handle = async () => {
      // Supabase automatically reads the hash fragment and sets the session
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        window.location.replace('/dashboard')
        return
      }

      // Wait a moment for Supabase to process the hash
      setTimeout(async () => {
        const { data: { session: retrySession } } = await supabase.auth.getSession()
        if (retrySession) {
          window.location.replace('/dashboard')
        } else {
          window.location.replace('/auth/login?error=session_failed')
        }
      }, 1500)
    }

    handle()
  }, [supabase])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0edf8',
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, background: '#6c47e8', borderRadius: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', color: '#fff', fontWeight: 700, fontSize: 22,
        }}>Z</div>
        <div style={{ fontSize: 15, color: '#1a1530', fontWeight: 500, marginBottom: 8 }}>
          Signing you in...
        </div>
        <div style={{ fontSize: 13, color: '#a89ec8' }}>Just a moment</div>
      </div>
    </div>
  )
}
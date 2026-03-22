'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import './settings.css'

type Section = 'profile' | 'notifications' | 'security'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export default function SettingsPage() {
  const [section, setSection] = useState<Section>('profile')
  const [toast, setToast] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    company: '',
    website: '',
    bio: '',
  })

  const [notifications, setNotifications] = useState({
    email_tasks: true,
    email_invoices: true,
    email_leads: false,
    email_weekly: true,
    email_marketing: false,
  })

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  })

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          email: user.email ?? '',
          company: data.company ?? '',
          website: data.website ?? '',
          bio: data.bio ?? '',
        })
      }
    }
    load()
  }, [supabase])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('users').update({
      full_name: profile.full_name,
    }).eq('id', user.id)
    setSaving(false)
    showToast('Profile saved')
  }

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showToast('Passwords do not match')
      return
    }
    if (passwords.new.length < 8) {
      showToast('Password must be at least 8 characters')
      return
    }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: passwords.new })
    setSaving(false)
    if (error) {
      showToast(`Error: ${error.message}`)
    } else {
      setPasswords({ current: '', new: '', confirm: '' })
      showToast('Password updated')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('Are you sure? This will permanently delete your account and all data. This cannot be undone.')
    if (!confirmed) return
    showToast('Please contact support to delete your account')
  }

  const NAV: { id: Section; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>,
    },
    {
      id: 'security',
      label: 'Security',
      icon: <svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>,
    },
  ]

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Settings</h1>
          <p className="topbar-sub">Manage your account and preferences</p>
        </div>
      </header>

      <div className="page-content">
        <div className="settings-grid">
          {/* Nav */}
          <div className="settings-nav">
            {NAV.map(n => (
              <button
                key={n.id}
                className={`settings-nav-item${section === n.id ? ' active' : ''}`}
                onClick={() => setSection(n.id)}
              >
                {n.icon}
                {n.label}
              </button>
            ))}
          </div>

          <div className="settings-section">
            {/* Profile */}
            {section === 'profile' && (
              <div className="settings-card">
                <div className="settings-card-title">Profile information</div>
                <div className="settings-card-desc">Update your name and account details</div>

                <div className="settings-avatar-row">
                  <div className="settings-avatar">
                    {profile.full_name ? getInitials(profile.full_name) : '?'}
                  </div>
                  <div className="settings-avatar-info">
                    Avatar is generated from your initials.<br />
                    Custom avatars coming soon.
                  </div>
                </div>

                <div className="settings-row">
                  <div className="settings-field">
                    <label className="settings-label">Full name</label>
                    <input
                      className="settings-input"
                      value={profile.full_name}
                      onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))}
                      placeholder="James Davidson"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Email</label>
                    <input
                      className="settings-input"
                      value={profile.email}
                      disabled
                      title="Email cannot be changed"
                    />
                  </div>
                </div>
                <div className="settings-row">
                  <div className="settings-field">
                    <label className="settings-label">Company</label>
                    <input
                      className="settings-input"
                      value={profile.company}
                      onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                      placeholder="Your company"
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Website</label>
                    <input
                      className="settings-input"
                      value={profile.website}
                      onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                      placeholder="https://yoursite.com"
                    />
                  </div>
                </div>
                <div className="settings-field">
                  <label className="settings-label">Bio</label>
                  <textarea
                    className="settings-textarea"
                    value={profile.bio}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    placeholder="Freelance designer & developer..."
                  />
                </div>

                <div className="settings-actions">
                  <button className="btn-ghost" onClick={() => showToast('Changes discarded')}>Cancel</button>
                  <button className="btn-primary" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Notifications */}
            {section === 'notifications' && (
              <div className="settings-card">
                <div className="settings-card-title">Email notifications</div>
                <div className="settings-card-desc">Choose which emails you want to receive from Zenta</div>

                {[
                  { key: 'email_tasks', title: 'Agent task updates', desc: 'Get notified when agent tasks complete or fail' },
                  { key: 'email_invoices', title: 'Invoice activity', desc: 'Alerts for overdue invoices and payments received' },
                  { key: 'email_leads', title: 'Lead activity', desc: 'Notifications when leads respond or go cold' },
                  { key: 'email_weekly', title: 'Weekly summary', desc: 'Your weekly business report every Monday' },
                  { key: 'email_marketing', title: 'Product updates', desc: 'New features, tips and Zenta news' },
                ].map(n => (
                  <div key={n.key} className="toggle-row">
                    <div className="toggle-info">
                      <div className="toggle-title">{n.title}</div>
                      <div className="toggle-desc">{n.desc}</div>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={notifications[n.key as keyof typeof notifications]}
                        onChange={e => setNotifications(prev => ({ ...prev, [n.key]: e.target.checked }))}
                      />
                      <span className="toggle-slider" />
                    </label>
                  </div>
                ))}

                <div className="settings-actions">
                  <button className="btn-primary" onClick={() => showToast('Notification preferences saved')}>
                    Save preferences
                  </button>
                </div>
              </div>
            )}

            {/* Security */}
            {section === 'security' && (
              <>
                <div className="settings-card">
                  <div className="settings-card-title">Change password</div>
                  <div className="settings-card-desc">Choose a strong password with at least 8 characters</div>

                  <div className="settings-field">
                    <label className="settings-label">New password</label>
                    <input
                      className="settings-input"
                      type="password"
                      placeholder="Min. 8 characters"
                      value={passwords.new}
                      onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Confirm new password</label>
                    <input
                      className="settings-input"
                      type="password"
                      placeholder="Repeat new password"
                      value={passwords.confirm}
                      onChange={e => setPasswords(p => ({ ...p, confirm: e.target.value }))}
                    />
                  </div>

                  <div className="settings-actions">
                    <button className="btn-primary" onClick={handleChangePassword} disabled={saving || !passwords.new}>
                      {saving ? 'Updating...' : 'Update password'}
                    </button>
                  </div>
                </div>

                <div className="settings-card danger-zone">
                  <div className="settings-card-title">Danger zone</div>
                  <div className="settings-card-desc">Permanently delete your account and all associated data</div>
                  <button className="btn-danger-outline" onClick={handleDeleteAccount}>
                    Delete my account
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {toast && (
        <div className="save-toast">
          <svg viewBox="0 0 24 24" fill="none" stroke="#1aad70" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
          </svg>
          {toast}
        </div>
      )}
    </>
  )
}
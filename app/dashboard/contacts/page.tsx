'use client'

import { useState } from 'react'
import { useContacts, type NewContact } from '@/hooks/useContacts'
import './contacts.css'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = ['#6c47e8', '#1aad70', '#f07030', '#2563eb', '#e84774', '#0891b2', '#7c3aed', '#059669']
function getAvatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]
}

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

interface AddContactModalProps {
  onClose: () => void
  onAdd: (contact: NewContact) => Promise<{ error?: string; data?: unknown } | void>
}

function AddContactModal({ onClose, onAdd }: AddContactModalProps) {
  const [form, setForm] = useState<NewContact>({ name: '', email: '', company: '', type: 'lead' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const result = await onAdd(form)
    if (result && 'error' in result && result.error) {
      setError(result.error)
      setSaving(false)
      return
    }
    setSaving(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add contact</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', color: '#d05820', fontSize: 13, padding: '10px 14px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Full name</label>
            <input className="modal-input" placeholder="Jane Smith" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          </div>
          <div className="modal-field">
            <label className="modal-label">Email</label>
            <input className="modal-input" type="email" placeholder="jane@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="modal-field">
            <label className="modal-label">Company</label>
            <input className="modal-input" placeholder="Company name" value={form.company ?? ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} />
          </div>
          <div className="modal-row">
            <div className="modal-field">
              <label className="modal-label">Phone</label>
              <input className="modal-input" placeholder="+1 555 000 0000" value={form.phone ?? ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="modal-field">
              <label className="modal-label">Type</label>
              <select className="modal-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'lead' | 'client' }))}>
                <option value="lead">Lead</option>
                <option value="client">Client</option>
              </select>
            </div>
          </div>
          <div className="modal-field">
            <label className="modal-label">Notes</label>
            <input className="modal-input" placeholder="Any notes..." value={form.notes ?? ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Add contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ContactsPage() {
  const { contacts, loading, error, addContact, deleteContact, deleteContacts } = useContacts()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'lead' | 'client'>('all')
  const [showModal, setShowModal] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const filtered = contacts.filter(c => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.company ?? '').toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || c.type === filter
    return matchSearch && matchFilter
  })

  const handleAdd = async (data: NewContact) => {
    return await addContact(data)
  }

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelected(prev => prev.length === filtered.length ? [] : filtered.map(c => c.id))
  }

  const handleBulkDelete = async () => {
    await deleteContacts(selected)
    setSelected([])
  }

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h1 className="topbar-title">Contacts</h1>
          <p className="topbar-sub">
            {loading ? 'Loading...' : `${contacts.length} total · ${contacts.filter(c => c.type === 'lead').length} leads · ${contacts.filter(c => c.type === 'client').length} clients`}
          </p>
        </div>
        <div className="topbar-right">
          {selected.length > 0 && (
            <button className="btn-danger" onClick={handleBulkDelete}>
              Delete {selected.length}
            </button>
          )}
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" style={{ width: 13, height: 13 }}>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add contact
          </button>
        </div>
      </header>

      <div className="page-content">
        {error && (
          <div style={{ background: '#fff4ec', border: '1px solid #f0c0a0', color: '#d05820', fontSize: 13, padding: '12px 16px', borderRadius: 10, marginBottom: 14 }}>
            {error}
          </div>
        )}

        <div className="contacts-toolbar">
          <div className="topbar-search" style={{ flex: 1, maxWidth: 320 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 13, height: 13, color: '#a89ec8' }}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input className="topbar-search-input" placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="filter-tabs">
            {(['all', 'lead', 'client'] as const).map(f => (
              <button key={f} className={`filter-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'lead' ? 'Leads' : 'Clients'}
              </button>
            ))}
          </div>
        </div>

        <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
          {loading ? (
            <div className="contacts-empty">Loading contacts...</div>
          ) : (
            <table className="contacts-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input type="checkbox" className="c-checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} />
                  </th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Phone</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="contacts-empty">
                      {search || filter !== 'all' ? 'No contacts match your search' : 'No contacts yet — add your first one'}
                    </td>
                  </tr>
                ) : filtered.map(contact => (
                  <tr key={contact.id} className={selected.includes(contact.id) ? 'selected' : ''}>
                    <td>
                      <input type="checkbox" className="c-checkbox" checked={selected.includes(contact.id)} onChange={() => toggleSelect(contact.id)} />
                    </td>
                    <td>
                      <div className="contact-name-cell">
                        <div className="contact-avatar" style={{ background: getAvatarColor(contact.name) }}>
                          {getInitials(contact.name)}
                        </div>
                        <div>
                          <div className="contact-name">{contact.name}</div>
                          <div className="contact-email">{contact.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="contact-company">{contact.company ?? '—'}</td>
                    <td>
                      <span className={`tag ${contact.type === 'lead' ? 'tag-orange' : 'tag-green'}`}>
                        {contact.type === 'lead' ? 'Lead' : 'Client'}
                      </span>
                    </td>
                    <td className="contact-meta">{contact.phone ?? '—'}</td>
                    <td className="contact-meta">{timeAgo(contact.created_at)}</td>
                    <td>
                      <div className="contact-actions">
                        <button className="action-icon-btn" title="Send follow-up email" onClick={() => window.location.href = `mailto:${contact.email}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" />
                          </svg>
                        </button>
                        <button className="action-icon-btn" title="Delete" onClick={() => deleteContact(contact.id)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="contacts-footer">
          Showing {filtered.length} of {contacts.length} contacts
        </div>
      </div>

      {showModal && <AddContactModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}
    </>
  )
}
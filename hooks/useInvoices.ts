import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Invoice {
  id: string
  user_id: string
  contact_id: string | null
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string
  sent_at: string | null
  paid_at: string | null
  description: string | null
  created_at: string
  contact_name?: string
  contact_email?: string
}

export interface NewInvoice {
  contact_id?: string
  contact_name: string
  contact_email: string
  amount: number
  currency?: string
  status: InvoiceStatus
  due_date: string
  description?: string
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('invoices')
      .select('*, contacts(name, email)')
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else {
      setInvoices((data ?? []).map((inv: Invoice & { contacts: { name: string; email: string } | null }) => ({
        ...inv,
        contact_name: inv.contacts?.name ?? '',
        contact_email: inv.contacts?.email ?? '',
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { fetch() }, [fetch])

  const addInvoice = async (invoice: NewInvoice) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    const { data, error } = await supabase
      .from('invoices')
      .insert({
        user_id: user.id,
        contact_id: invoice.contact_id ?? null,
        amount: invoice.amount,
        currency: invoice.currency ?? 'USD',
        status: invoice.status,
        due_date: invoice.due_date,
        description: invoice.description ?? null,
        sent_at: invoice.status === 'sent' ? new Date().toISOString() : null,
      })
      .select()
      .single()
    if (error) return { error: error.message }
    setInvoices(prev => [{ ...data, contact_name: invoice.contact_name, contact_email: invoice.contact_email }, ...prev])
    return { data }
  }

  const updateStatus = async (id: string, status: InvoiceStatus) => {
    const updates: Partial<Invoice> = { status }
    if (status === 'paid') updates.paid_at = new Date().toISOString()
    if (status === 'sent') updates.sent_at = new Date().toISOString()
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...data } : inv))
    return { data }
  }

  const deleteInvoice = async (id: string) => {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) return { error: error.message }
    setInvoices(prev => prev.filter(inv => inv.id !== id))
    return {}
  }

  const stats = {
    total: invoices.reduce((s, i) => s + i.amount, 0),
    outstanding: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    overdue: invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.amount, 0),
    paid: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
  }

  return { invoices, loading, error, refetch: fetch, addInvoice, updateStatus, deleteInvoice, stats }
}
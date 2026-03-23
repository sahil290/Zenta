import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Contact {
  id: string
  user_id: string
  type: 'lead' | 'client'
  name: string
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string
}

export interface NewContact {
  type: 'lead' | 'client'
  name: string
  email: string
  company?: string
  phone?: string
  notes?: string
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setContacts(data ?? [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const addContact = async (contact: NewContact) => {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Auth user:', user, 'Auth error:', authError)
    if (!user) return { error: 'Not authenticated — please log in again' }

    const payload = { ...contact, user_id: user.id }
    console.log('Inserting contact:', payload)

    const { data, error } = await supabase
      .from('contacts')
      .insert(payload)
      .select()
      .single()

    console.log('Insert result:', data, 'Error:', error)
    if (error) return { error: error.message }
    setContacts(prev => [data, ...prev])
    return { data }
  }

  const deleteContact = async (id: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', id)
    if (error) return { error: error.message }
    setContacts(prev => prev.filter(c => c.id !== id))
    return {}
  }

  const deleteContacts = async (ids: string[]) => {
    const { error } = await supabase.from('contacts').delete().in('id', ids)
    if (error) return { error: error.message }
    setContacts(prev => prev.filter(c => !ids.includes(c.id)))
    return {}
  }

  const updateContact = async (id: string, updates: Partial<Contact>) => {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    setContacts(prev => prev.map(c => c.id === id ? data : c))
    return { data }
  }

  return { contacts, loading, error, refetch: fetch, addContact, deleteContact, deleteContacts, updateContact }
}
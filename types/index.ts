// User & Auth
export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

// Subscription plans
export type PlanType = 'free' | 'starter' | 'pro' | 'agency'

export interface Subscription {
  id: string
  user_id: string
  plan: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  current_period_end: string | null
  created_at: string
}

// Agent tasks
export type TaskType =
  | 'invoice_send'
  | 'invoice_chase'
  | 'lead_followup'
  | 'client_onboard'
  | 'proposal_draft'
  | 'crm_sync'
  | 'weekly_report'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface AgentTask {
  id: string
  user_id: string
  type: TaskType
  status: TaskStatus
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  credits_used: number
  created_at: string
  completed_at: string | null
}

// Contacts (leads / clients)
export type ContactType = 'lead' | 'client'

export interface Contact {
  id: string
  user_id: string
  type: ContactType
  name: string
  email: string
  company: string | null
  phone: string | null
  notes: string | null
  last_contacted_at: string | null
  created_at: string
}

// Invoices
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface Invoice {
  id: string
  user_id: string
  contact_id: string
  amount: number
  currency: string
  status: InvoiceStatus
  due_date: string
  sent_at: string | null
  paid_at: string | null
  description: string | null
  created_at: string
}

// Integrations
export type IntegrationType = 'gmail' | 'notion' | 'slack' | 'stripe'

export interface Integration {
  id: string
  user_id: string
  type: IntegrationType
  is_connected: boolean
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  created_at: string
}

// Agent run log
export interface AgentLog {
  id: string
  task_id: string
  message: string
  level: 'info' | 'warn' | 'error'
  created_at: string
}

// Plan limits
export const PLAN_LIMITS: Record<PlanType, { tasks_per_month: number; contacts: number; integrations: number }> = {
  free:    { tasks_per_month: 10,   contacts: 25,   integrations: 1 },
  starter: { tasks_per_month: 200,  contacts: 500,  integrations: 3 },
  pro:     { tasks_per_month: 1000, contacts: 5000, integrations: 10 },
  agency:  { tasks_per_month: 9999, contacts: 99999, integrations: 99 },
}

// Pricing
export const PLAN_PRICES: Record<Exclude<PlanType, 'free'>, { monthly: number; label: string }> = {
  starter: { monthly: 49,  label: 'Starter' },
  pro:     { monthly: 99,  label: 'Pro' },
  agency:  { monthly: 199, label: 'Agency' },
}

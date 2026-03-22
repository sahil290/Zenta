import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as _createSupabase } from '@supabase/supabase-js'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createClient = (url: string, key: string) => _createSupabase<any>(url, key)
import { cookies } from 'next/headers'
import { runAgent, parseEmailOutput } from '@/lib/agent/runner'
import { notifySlack } from '@/lib/integrations/slack'
import { fireZapierWebhook } from '@/lib/integrations/zapier'
import { logTaskToNotion } from '@/lib/integrations/notion'
import { sendViaGmail } from '@/lib/integrations/gmail'

export async function POST(req: NextRequest) {
  let userId: string | null = null

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await adminClient.auth.getUser(token)
    if (user) userId = user.id
  }

  if (!userId) {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) userId = session.user.id
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { taskType, input, draftMode } = await req.json()
  if (!taskType || !input) {
    return NextResponse.json({ error: 'Missing taskType or input' }, { status: 400 })
  }

  // Tasks that default to review-first (client-facing)
  const REVIEW_TASKS = ['lead_followup', 'client_onboard', 'proposal_draft', 'invoice_send']
  const requiresReview = draftMode === true || (draftMode !== false && REVIEW_TASKS.includes(taskType))

  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .insert({
      user_id: userId,
      type: taskType,
      status: requiresReview ? 'pending_review' : 'running',
      input,
      credits_used: 1,
    })
    .select()
    .single()

  if (taskError || !task) {
    console.error('Task insert error:', JSON.stringify(taskError))
    return NextResponse.json({ error: `Failed to create task: ${taskError?.message ?? 'unknown'}`, details: taskError }, { status: 500 })
  }

  try {
    // Fetch user integrations
    const { data: userIntegrations } = await supabase
      .from('integrations')
      .select('type, config')
      .eq('user_id', userId)
      .eq('status', 'active')

    const integrationMap: Record<string, Record<string, string>> = {}
    userIntegrations?.forEach((i: { type: string; config: Record<string, string> }) => {
      integrationMap[i.type] = i.config
    })

    const result = await runAgent({
      taskType,
      input,
      draftMode: requiresReview,
      onLog: async (message) => {
        await supabase.from('agent_logs').insert({
          task_id: task.id,
          message,
          level: 'info',
        })
      },
    })

    // If draft mode — save output but don't send email, wait for approval
    if (requiresReview) {
      await supabase
        .from('agent_tasks')
        .update({
          status: 'pending_review',
          output: { text: result.output },
        })
        .eq('id', task.id)

      return NextResponse.json({
        success: true,
        taskId: task.id,
        output: result.output,
        pendingReview: true,
      })
    }

    // Special handling for weekly report — fetch real stats first
    if (taskType === 'weekly_report') {
      const [{ data: invoices }, { data: contacts }, { data: agentTasks }] = await Promise.all([
        supabase.from('invoices').select('amount, status, created_at, paid_at').eq('user_id', userId),
        supabase.from('contacts').select('type, created_at').eq('user_id', userId),
        supabase.from('agent_tasks').select('type, status, created_at').eq('user_id', userId),
      ])

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

      const paidThisMonth = (invoices ?? []).filter((i: {status: string; paid_at: string; amount: number}) => i.status === 'paid' && i.paid_at >= monthStart).reduce((s: number, i: {amount: number}) => s + i.amount, 0)
      const outstanding = (invoices ?? []).filter((i: {status: string; amount: number}) => i.status === 'sent' || i.status === 'overdue').reduce((s: number, i: {amount: number}) => s + i.amount, 0)
      const overdueCount = (invoices ?? []).filter((i: {status: string}) => i.status === 'overdue').length
      const newContacts = (contacts ?? []).filter((c: {created_at: string}) => c.created_at >= weekAgo).length
      const leads = (contacts ?? []).filter((c: {type: string}) => c.type === 'lead').length
      const clients = (contacts ?? []).filter((c: {type: string}) => c.type === 'client').length
      const tasksThisWeek = (agentTasks ?? []).filter((t: {status: string; created_at: string}) => t.status === 'completed' && t.created_at >= weekAgo).length

      // Inject real stats into the input
      ;(input as Record<string, unknown>).real_stats = JSON.stringify({
        revenue_this_month: `$${paidThisMonth.toLocaleString()}`,
        outstanding: `$${outstanding.toLocaleString()}`,
        overdue_invoices: overdueCount,
        new_contacts_this_week: newContacts,
        total_leads: leads,
        total_clients: clients,
        agent_tasks_completed_this_week: tasksThisWeek,
        total_invoices: (invoices ?? []).length,
      })
    }
    if (taskType === 'crm_sync') {
      const contactName = (input as Record<string, string>).contact_name
      if (contactName) {
        await supabase
          .from('contacts')
          .update({
            notes: result.output,
            last_contacted_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .ilike('name', contactName)
      }
    }

    // Special handling for weekly report — email it to the user
    if (taskType === 'weekly_report') {
      const { data: authData } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single()
      const userEmail = authData?.full_name // fallback — we need email from auth

      // Get email from auth using admin approach
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      // We have the bearer token so use it to get user email
      const authHeader = req.headers.get('Authorization')
      let userEmailAddress: string | null = null
      if (authHeader?.startsWith('Bearer ')) {
        const { data: { user: authUser } } = await adminClient.auth.getUser(authHeader.slice(7))
        userEmailAddress = authUser?.email ?? null
      }

      if (userEmailAddress && process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend')
        const resend = new Resend(process.env.RESEND_API_KEY)
        const { buildEmailHtml } = await import('@/lib/email/template')
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
          to: userEmailAddress,
          subject: `Your weekly Zenta report — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}`,
          html: buildEmailHtml({
            subject: 'Weekly Business Report',
            body: result.output,
            taskType: 'weekly_report',
          }),
          text: result.output,
        }).catch(e => console.error('Weekly report email error:', e))
      }

      // Also post to Slack if connected
      if (integrationMap.slack?.slack_webhook) {
        const { notifySlack } = await import('@/lib/integrations/slack')
        await notifySlack({
          webhookUrl: integrationMap.slack.slack_webhook,
          channel: integrationMap.slack.slack_channel,
          taskType: 'weekly_report',
          output: result.output,
          input: input as Record<string, unknown>,
        }).catch(e => console.error('Weekly report Slack error:', e))
      }
    }

    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output: { text: result.output },
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id)

    // Fire all integrations in parallel
    const EMAIL_TASKS = ['invoice_chase', 'invoice_send', 'lead_followup', 'client_onboard', 'proposal_draft']
    const isEmailTask = EMAIL_TASKS.includes(taskType)
    const recipientEmail = (input as Record<string, string>).contact_email
    const integrationPromises: Promise<unknown>[] = []

    if (integrationMap.slack?.slack_webhook) {
      integrationPromises.push(
        notifySlack({
          webhookUrl: integrationMap.slack.slack_webhook,
          channel: integrationMap.slack.slack_channel,
          taskType,
          output: result.output,
          input: input as Record<string, unknown>,
        }).catch(e => console.error('Slack error:', e))
      )
    }

    if (integrationMap.zapier?.zapier_webhook) {
      integrationPromises.push(
        fireZapierWebhook({
          webhookUrl: integrationMap.zapier.zapier_webhook,
          event: 'task.completed',
          data: { taskType, taskId: task.id, input, output: result.output },
        }).catch(e => console.error('Zapier error:', e))
      )
    }

    if (integrationMap.notion?.notion_token && integrationMap.notion?.notion_db) {
      integrationPromises.push(
        logTaskToNotion({
          token: integrationMap.notion.notion_token,
          databaseId: integrationMap.notion.notion_db,
          taskType,
          output: result.output,
          input: input as Record<string, unknown>,
          status: 'completed',
        }).catch(e => console.error('Notion error:', e))
      )
    }

    if (integrationMap.gmail?.access_token && isEmailTask && recipientEmail) {
      const { subject, body } = parseEmailOutput(result.output)
      integrationPromises.push(
        sendViaGmail({
          config: integrationMap.gmail as {
            access_token: string
            refresh_token: string
            token_expiry: string
            gmail_email: string
          },
          to: recipientEmail,
          subject,
          body,
        }).catch(e => console.error('Gmail error:', e))
      )
    }

    await Promise.allSettled(integrationPromises)

    return NextResponse.json({
      success: true,
      taskId: task.id,
      output: result.output,
      integrationsUsed: Object.keys(integrationMap),
    })

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await supabase
      .from('agent_tasks')
      .update({ status: 'failed', error: message })
      .eq('id', task.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
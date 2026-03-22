import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildEmailHtml } from '@/lib/email/template'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: NextRequest) {
  let userId: string | null = null

  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await client.auth.getUser(authHeader.slice(7))
    if (user) userId = user.id
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { taskId, editedOutput } = await req.json()
  if (!taskId) return NextResponse.json({ error: 'Missing taskId' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch the draft task
  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', userId)
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  const output = editedOutput ?? (task.output as { text: string })?.text ?? ''
  const input = task.input as Record<string, string>

  // Parse email from output
  const subjectMatch = output.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = output.match(/BODY:\s*([\s\S]*?)(?=SUMMARY:|$)/i)
  const subject = subjectMatch?.[1]?.trim() ?? 'Follow-up from Zenta'
  const body = bodyMatch?.[1]?.trim() ?? output

  const recipientEmail = input.contact_email
  if (!recipientEmail) {
    return NextResponse.json({ error: 'No recipient email in task' }, { status: 400 })
  }

  // Send the email via Resend
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
    to: recipientEmail,
    subject,
    html: buildEmailHtml({ subject, body, taskType: task.type }),
    text: body,
  })

  // Mark task as completed
  await supabase
    .from('agent_tasks')
    .update({
      status: 'completed',
      output: { text: editedOutput ?? output },
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)

  return NextResponse.json({ success: true })
}
import Groq from 'groq-sdk'
import { Resend } from 'resend'
import { buildEmailHtml } from '@/lib/email/template'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! })
const resend = new Resend(process.env.RESEND_API_KEY!)

const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `You are Zenta, a professional AI business operations agent for freelancers and small agencies.

Your job is to handle business operations: invoicing, lead follow-ups, client onboarding, proposals, and CRM updates.

Rules:
- Always be professional, concise, and action-oriented
- Write emails naturally — not robotic or overly formal
- When chasing invoices, be firm but polite
- Keep responses focused and practical
- For emails, output ONLY in this exact format:
  SUBJECT: <subject line>
  BODY: <email body>
- After the email, add a line: SUMMARY: <one sentence summary of what was done>`

type TaskType =
  | 'invoice_send'
  | 'invoice_chase'
  | 'lead_followup'
  | 'client_onboard'
  | 'proposal_draft'
  | 'crm_sync'
  | 'weekly_report'

function buildPrompt(taskType: TaskType, input: Record<string, unknown>): string {
  switch (taskType) {
    case 'invoice_chase':
      return `Write a professional invoice follow-up email to ${input.contact_name} (${input.contact_email}).
Invoice amount: ${input.amount}
Original due date: ${input.due_date ?? 'recently passed'}
Days overdue: ${input.days_overdue}

Important rules:
- Do NOT include any placeholder text like [Payment Link] or [Payment Method]
- Do NOT include square brackets anywhere
- Tell them to reply to this email to arrange payment
- Keep it under 150 words
- Be firm but professional`

    case 'lead_followup':
      return `Write a personalized follow-up email to ${input.contact_name} at ${input.company ?? 'their company'} (${input.contact_email}).
Context: ${input.context ?? 'Initial inquiry'}
Goal: Re-engage and move toward a discovery call.
Rules: No placeholders, no square brackets, keep under 120 words, end with a specific question to prompt a reply.`

    case 'client_onboard':
      return `Write a professional welcome email to new client ${input.contact_name} (${input.contact_email}).
Project: ${input.project_type ?? 'consulting services'}
Rules: No placeholders, no square brackets, keep under 150 words. Tell them you will be in touch within 24 hours with next steps.`

    case 'invoice_send':
      return `Write a professional email sending an invoice to ${input.contact_name} (${input.contact_email}).
Amount: ${input.amount}
Description: ${input.description ?? 'Professional services'}
Rules: No placeholders, no square brackets. Tell them to reply to arrange payment. Keep under 100 words.`

    case 'proposal_draft':
      return `Write a professional project proposal email to ${input.contact_name} at ${input.company ?? 'their company'}.
Project: ${input.project_type}
Budget: ${input.budget ?? 'TBD'}
Rules: No placeholders, no square brackets. Include brief overview, scope, and clear next step. Keep under 200 words.`

    case 'crm_sync':
      return `Create a structured CRM note for contact ${input.contact_name}.
Interaction notes: "${input.notes}"
Format as: date, summary, follow-up actions needed.`

    case 'weekly_report':
      return `Generate a professional weekly business summary report for: ${input.period ?? 'this week'}.

Real business data:
${input.real_stats ?? 'No data available yet'}

Write a clear, actionable report with these sections:
1. Revenue snapshot
2. Pipeline & leads
3. Agent activity this week
4. Overdue invoices needing attention
5. Priorities for next week

Be specific with the numbers provided. Keep it concise and actionable.`

    default:
      return `Complete this business task: ${JSON.stringify(input)}`
  }
}

export function parseEmailOutput(output: string): { subject: string; body: string; summary: string } {
  const subjectMatch = output.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = output.match(/BODY:\s*([\s\S]*?)(?=SUMMARY:|$)/i)
  const summaryMatch = output.match(/SUMMARY:\s*(.+)/i)

  return {
    subject: subjectMatch?.[1]?.trim() ?? 'Follow-up from Zenta',
    body: bodyMatch?.[1]?.trim() ?? output,
    summary: summaryMatch?.[1]?.trim() ?? 'Task completed.',
  }
}

const EMAIL_TASKS: TaskType[] = ['invoice_chase', 'invoice_send', 'lead_followup', 'client_onboard', 'proposal_draft']

export async function runAgent({
  taskType,
  input,
  draftMode = false,
  onLog,
}: {
  taskType: TaskType
  input: Record<string, unknown>
  draftMode?: boolean
  onLog?: (message: string) => void
}): Promise<{ success: boolean; output: string }> {
  onLog?.(`Starting task: ${taskType}`)

  const prompt = buildPrompt(taskType, input)
  onLog?.('Generating with Groq AI...')

  const completion = await groq.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  })

  const rawOutput = completion.choices[0]?.message?.content ?? ''
  onLog?.('AI generation complete')

  // Don't send email if in draft mode — wait for user approval
  const isEmailTask = EMAIL_TASKS.includes(taskType)
  const recipientEmail = input.contact_email as string | undefined

  if (isEmailTask && recipientEmail && process.env.RESEND_API_KEY && !draftMode) {
    const { subject, body, summary } = parseEmailOutput(rawOutput)
    onLog?.(`Sending email to ${recipientEmail}...`)

    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
        to: recipientEmail,
        subject,
        html: buildEmailHtml({ subject, body, taskType }),
        text: body,
      })
      onLog?.('Email sent successfully')
      return {
        success: true,
        output: `✓ Email sent to ${recipientEmail}\n\nSubject: ${subject}\n\n${body}\n\n---\n${summary}`,
      }
    } catch {
      onLog?.('Email send failed — returning draft')
      return {
        success: true,
        output: `⚠ Email draft (sending failed):\n\nSubject: ${subject}\n\n${body}\n\n---\n${summary}`,
      }
    }
  }

  return { success: true, output: rawOutput }
}
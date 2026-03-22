export async function notifySlack({
  webhookUrl,
  channel,
  taskType,
  output,
  input,
}: {
  webhookUrl: string
  channel?: string
  taskType: string
  output: string
  input: Record<string, unknown>
}) {
  const taskLabels: Record<string, string> = {
    invoice_chase: '📞 Invoice chased',
    lead_followup: '📧 Lead followed up',
    client_onboard: '🎉 Client onboarded',
    invoice_send: '📄 Invoice sent',
    proposal_draft: '✍️ Proposal drafted',
    weekly_report: '📊 Weekly report',
    crm_sync: '🔄 CRM synced',
  }

  const contactName = String(Object.values(input)[0] ?? '')
  const label = taskLabels[taskType] ?? '✅ Task completed'

  const payload = {
    ...(channel ? { channel } : {}),
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `Zenta Agent — ${label}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Contact:*\n${contactName || 'N/A'}` },
          { type: 'mrkdwn', text: `*Task:*\n${label}` },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Output:*\n${output.slice(0, 300)}${output.length > 300 ? '...' : ''}`,
        },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Sent by Zenta · ${new Date().toLocaleString()}` }],
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Slack error: ${res.status}`)
  return true
}
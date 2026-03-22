type ZapierEvent =
  | 'task.completed'
  | 'invoice.paid'
  | 'contact.added'
  | 'lead.responded'
  | 'task.failed'

export async function fireZapierWebhook({
  webhookUrl,
  event,
  data,
}: {
  webhookUrl: string
  event: ZapierEvent
  data: Record<string, unknown>
}) {
  const payload = {
    event,
    timestamp: new Date().toISOString(),
    source: 'zenta',
    data,
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) throw new Error(`Zapier webhook error: ${res.status}`)
  return true
}
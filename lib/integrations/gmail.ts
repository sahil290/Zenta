interface GmailConfig {
  access_token: string
  refresh_token: string
  token_expiry: string
  gmail_email: string
}

async function refreshAccessToken(config: GmailConfig): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: config.refresh_token,
      grant_type: 'refresh_token',
    }),
  })
  const data = await res.json()
  return data.access_token
}

function makeEmailRaw({
  from, to, subject, body,
}: { from: string; to: string; subject: string; body: string }) {
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    `<div style="font-family:sans-serif;max-width:600px;padding:24px;color:#1a1530">${body.replace(/\n/g, '<br/>')}</div>`,
  ].join('\r\n')

  return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendViaGmail({
  config,
  to,
  subject,
  body,
}: {
  config: GmailConfig
  to: string
  subject: string
  body: string
}) {
  // Refresh token if expired
  let accessToken = config.access_token
  if (new Date(config.token_expiry) < new Date()) {
    accessToken = await refreshAccessToken(config)
  }

  const raw = makeEmailRaw({ from: config.gmail_email, to, subject, body })

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Gmail send error: ${err.error?.message ?? res.status}`)
  }

  return true
}
interface EmailTemplateOptions {
  subject: string
  body: string
  taskType: string
  recipientName?: string
  senderName?: string
}

const TASK_COLORS: Record<string, { bg: string; accent: string; icon: string; label: string }> = {
  invoice_chase:  { bg: '#fff4ec', accent: '#f07030', icon: '📞', label: 'Invoice Follow-up' },
  lead_followup:  { bg: '#f0edf8', accent: '#6c47e8', icon: '✉️', label: 'Following Up' },
  client_onboard: { bg: '#e6f9f0', accent: '#1aad70', icon: '🎉', label: 'Welcome' },
  invoice_send:   { bg: '#eff4ff', accent: '#2563eb', icon: '📄', label: 'Invoice' },
  proposal_draft: { bg: '#fdf0f8', accent: '#c026a8', icon: '✍️', label: 'Proposal' },
  weekly_report:  { bg: '#f0edf8', accent: '#6c47e8', icon: '📊', label: 'Weekly Report' },
  crm_sync:       { bg: '#e6f7fa', accent: '#0891b2', icon: '🔄', label: 'Update' },
}

export function buildEmailHtml(options: EmailTemplateOptions): string {
  const { body, taskType, senderName } = options
  const meta = TASK_COLORS[taskType] ?? TASK_COLORS.lead_followup

  // Format body — preserve paragraphs
  const formattedBody = body
    .split('\n\n')
    .filter(p => p.trim())
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.7;color:#3a2a6a;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${options.subject}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0edf8;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0edf8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="padding-bottom:24px;" align="center">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#6c47e8;border-radius:12px;padding:10px 16px;display:inline-block;">
                    <span style="color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Z</span>
                    <span style="color:#fff;font-size:16px;font-weight:600;margin-left:6px;">Zenta</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(108,71,232,0.10);">

              <!-- Accent bar -->
              <div style="background:linear-gradient(135deg,#6c47e8,#9b7df5);height:6px;"></div>

              <!-- Task badge -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:28px 32px 0;">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:${meta.bg};border-radius:20px;padding:6px 14px;">
                          <span style="font-size:14px;margin-right:6px;">${meta.icon}</span>
                          <span style="font-size:12px;font-weight:600;color:${meta.accent};text-transform:uppercase;letter-spacing:0.5px;">${meta.label}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Body -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 32px 8px;">
                <tr>
                  <td style="font-size:15px;line-height:1.7;color:#3a2a6a;">
                    ${formattedBody}
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <table width="100%" cellpadding="0" cellspacing="0" style="padding:0 32px;">
                <tr>
                  <td style="border-top:1px solid #ece8f5;padding-top:20px;padding-bottom:24px;">
                    <p style="margin:0;font-size:13px;color:#a89ec8;line-height:1.6;">
                      ${senderName ? `Sent on behalf of <strong style="color:#6a6085;">${senderName}</strong> via` : 'Sent via'}
                      <span style="color:#6c47e8;font-weight:600;"> Zenta AI</span>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;" align="center">
              <p style="margin:0 0 8px;font-size:12px;color:#a89ec8;">
                Powered by <a href="https://zenta.app" style="color:#6c47e8;text-decoration:none;font-weight:600;">Zenta</a> · AI business agent for founders
              </p>
              <p style="margin:0;font-size:11px;color:#c0b8d8;">
                You received this because a Zenta user automated this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function buildPlainText(body: string): string {
  return body
}
const NOTION_API = 'https://api.notion.com/v1'

export async function logTaskToNotion({
  token,
  databaseId,
  taskType,
  output,
  input,
  status,
}: {
  token: string
  databaseId: string
  taskType: string
  output: string
  input: Record<string, unknown>
  status: string
}) {
  const contactName = String(Object.values(input)[0] ?? '')

  const payload = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: `${taskType.replace('_', ' ')} — ${contactName}` } }],
      },
      Status: {
        select: { name: status === 'completed' ? 'Done' : 'Failed' },
      },
      Type: {
        select: { name: taskType },
      },
      Contact: {
        rich_text: [{ text: { content: contactName } }],
      },
      Date: {
        date: { start: new Date().toISOString() },
      },
    },
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: output.slice(0, 2000) } }],
        },
      },
    ],
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Notion error: ${err.message ?? res.status}`)
  }
  return true
}

export async function addContactToNotion({
  token,
  databaseId,
  name,
  email,
  company,
  type,
}: {
  token: string
  databaseId: string
  name: string
  email: string
  company?: string
  type: string
}) {
  const payload = {
    parent: { database_id: databaseId },
    properties: {
      Name: {
        title: [{ text: { content: name } }],
      },
      Email: {
        email,
      },
      Company: {
        rich_text: [{ text: { content: company ?? '' } }],
      },
      Type: {
        select: { name: type },
      },
      Added: {
        date: { start: new Date().toISOString() },
      },
    },
  }

  const res = await fetch(`${NOTION_API}/pages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Notion error: ${err.message ?? res.status}`)
  }
  return true
}
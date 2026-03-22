import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { runAgent } from '@/lib/agent/runner'

export async function POST(req: NextRequest) {
  let userId: string | null = null

  // Try Bearer token first (most reliable)
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

  // Fall back to cookie-based auth
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

  // Create a client for DB operations using service role isn't needed
  // since we have userId — use anon client with user context
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { taskType, input } = await req.json()

  if (!taskType || !input) {
    return NextResponse.json({ error: 'Missing taskType or input' }, { status: 400 })
  }

  const { data: task, error: taskError } = await supabase
    .from('agent_tasks')
    .insert({
      user_id: userId,
      type: taskType,
      status: 'running',
      input,
      credits_used: 1,
    })
    .select()
    .single()

  if (taskError || !task) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }

  try {
    const result = await runAgent({
      taskType,
      input,
      onLog: async (message) => {
        await supabase.from('agent_logs').insert({
          task_id: task.id,
          message,
          level: 'info',
        })
      },
    })

    // Mark task completed
    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        output: { text: result.output },
        completed_at: new Date().toISOString(),
      })
      .eq('id', task.id)

    return NextResponse.json({
      success: true,
      taskId: task.id,
      output: result.output,
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
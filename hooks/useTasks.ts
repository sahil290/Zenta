import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'pending_review'

export interface AgentTask {
  id: string
  user_id: string
  type: string
  status: TaskStatus
  input: Record<string, unknown>
  output: Record<string, unknown> | null
  error: string | null
  credits_used: number
  created_at: string
  completed_at: string | null
}

export function useTasks() {
  const [tasks, setTasks] = useState<AgentTask[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('agent_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)
    setTasks(data ?? [])
    setLoading(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const creditsUsed = tasks.reduce((s, t) => s + (t.credits_used ?? 0), 0)

  return { tasks, loading, refetch: fetch, creditsUsed }
}
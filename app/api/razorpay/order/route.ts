import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const PLANS = {
  pro:    { id: 'pro',    amount: 7900,  currency: 'USD', description: 'Zenta Pro — $79/month' },
  agency: { id: 'agency', amount: 19900, currency: 'USD', description: 'Zenta Agency — $199/month' },
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  )

  let userId: string | null = null
  const authHeader = req.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const { createClient: _sc } = await import('@supabase/supabase-js')
    const client = _sc<any>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data: { user } } = await client.auth.getUser(authHeader.slice(7))
    if (user) userId = user.id
  }
  if (!userId) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) userId = session.user.id
  }
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { planId } = await req.json()
  const plan = PLANS[planId as keyof typeof PLANS]
  if (!plan) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const order = await razorpay.orders.create({
    amount: plan.amount,
    currency: plan.currency,
    notes: { userId, planId },
  })

  return NextResponse.json({ orderId: order.id, amount: plan.amount, currency: plan.currency, planId })
}
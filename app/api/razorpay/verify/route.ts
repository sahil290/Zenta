import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId } = await req.json()

  const body = razorpay_order_id + '|' + razorpay_payment_id
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex')

  if (expectedSignature !== razorpay_signature) {
    return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  await supabase.from('subscriptions').delete().eq('user_id', userId)
  const { error } = await supabase.from('subscriptions').insert({
      user_id: userId,
      plan: planId,
      status: 'active',
      stripe_payment_intent_id: razorpay_payment_id,
      stripe_subscription_id: razorpay_order_id,
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

  if (error) return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 })

  return NextResponse.json({ success: true, planId })
}
import { NextRequest, NextResponse } from 'next/server'
import { sendPushNotification } from '@/lib/notifications/push'

export async function POST(request: NextRequest) {
  // Only callable from server actions via internal network
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { userId, title, body, data } = await request.json()
  await sendPushNotification(userId, title, body, data)

  return NextResponse.json({ success: true })
}

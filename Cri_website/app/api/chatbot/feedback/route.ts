// app/api/chatbot/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(req: NextRequest) {
  const { sessionId, score } = await req.json()

  if (!sessionId || (score !== 1 && score !== -1)) {
    return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Update the most recent conversation row for this session
    const { error } = await supabase
      .from('conversations')
      .update({ feedback_score: score })
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: false })
      .limit(1)

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch {
    // Silent fail — feedback is best-effort, never block the user
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
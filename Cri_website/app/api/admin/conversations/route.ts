// app/api/admin/conversations/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

// ── GET — paginated list + CSV export ─────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page      = parseInt(searchParams.get('page')           || '1')
  const limit     = parseInt(searchParams.get('limit')          || '20')
  const search    = searchParams.get('search')                  || ''
  const flagged   = searchParams.get('flagged')
  const lowConf   = searchParams.get('low_confidence')
  const dateFrom  = searchParams.get('date_from')
  const dateTo    = searchParams.get('date_to')
  const sessionId = searchParams.get('session_id')              || ''
  const format    = searchParams.get('format')

  const offset    = (page - 1) * limit
  const supabase  = getSupabase()

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })

  if (search)             query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
  if (flagged === 'true') query = query.eq('is_flagged', true)
  if (flagged === 'false')query = query.eq('is_flagged', false)
  if (lowConf === 'true') query = query.eq('is_low_confidence', true)
  if (dateFrom)           query = query.gte('timestamp', dateFrom)
  if (dateTo)             query = query.lte('timestamp', dateTo)
  if (sessionId)          query = query.eq('session_id', sessionId)   // exact match

  // CSV export — no pagination, return all matching rows
  if (format === 'csv') {
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const csv = buildCSV(data || [])
    return new NextResponse(csv, {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="conversations_cri_${new Date().toISOString().split('T')[0]}.csv"`,
      }
    })
  }

  // Paginated list
  const { data, count, error } = await query.range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total:      count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    }
  })
}

// ── PATCH — flag / unflag / add note ──────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  let body: { is_flagged?: boolean; flag_reason?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Corps invalide' }, { status: 400 }) }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('conversations')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function escapeCSV(val: unknown): string {
  if (val === null || val === undefined) return ''
  const str = Array.isArray(val) ? val.join(' | ') : String(val)
  return `"${str.replace(/"/g, '""')}"`
}

function buildCSV(rows: Record<string, unknown>[]): string {
  const headers = ['id', 'timestamp', 'question', 'answer', 'source_urls', 'is_flagged', 'is_low_confidence', 'flag_reason', 'session_id']
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escapeCSV(r[h])).join(','))
  ]
  return '\uFEFF' + lines.join('\n')  // BOM for Excel
}
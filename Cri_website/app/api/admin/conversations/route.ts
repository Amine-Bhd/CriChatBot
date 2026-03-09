// app/api/admin/conversations/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// API REST pour le tableau de bord admin
// GET  /api/admin/conversations         → liste paginée + filtres
// GET  /api/admin/conversations/export  → export CSV
// PATCH /api/admin/conversations/:id    → flag / unflag
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!   // service role pour accès admin complet
)

// ── GET — liste des conversations ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const page     = parseInt(searchParams.get('page')     || '1')
  const limit    = parseInt(searchParams.get('limit')    || '20')
  const search   = searchParams.get('search')            || ''
  const flagged  = searchParams.get('flagged')           // 'true' | 'false' | null
  const lowConf  = searchParams.get('low_confidence')    // 'true' | null
  const dateFrom = searchParams.get('date_from')         // ISO string
  const dateTo   = searchParams.get('date_to')           // ISO string
  const format   = searchParams.get('format')            // 'csv'

  const offset = (page - 1) * limit

  let query = supabase
    .from('conversations')
    .select('*', { count: 'exact' })
    .order('timestamp', { ascending: false })

  // Filtres
  if (search) {
    query = query.or(`question.ilike.%${search}%,answer.ilike.%${search}%`)
  }
  if (flagged === 'true')  query = query.eq('is_flagged', true)
  if (flagged === 'false') query = query.eq('is_flagged', false)
  if (lowConf === 'true')  query = query.eq('is_low_confidence', true)
  if (dateFrom)            query = query.gte('timestamp', dateFrom)
  if (dateTo)              query = query.lte('timestamp', dateTo)

  // Export CSV (sans pagination)
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

  // Liste paginée
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

// ── PATCH — flag / unflag / ajouter note ─────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'ID manquant' }, { status: 400 })

  let body: { is_flagged?: boolean; flag_reason?: string }
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Corps invalide' }, { status: 400 }) }

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
  return '\uFEFF' + lines.join('\n')  // BOM pour Excel
}
'use client'
// app/admin/page.tsx

import { useState, useEffect, useCallback } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Conversation {
  id: number
  question: string
  answer: string
  source_urls: string[] | null
  is_flagged: boolean
  is_low_confidence: boolean
  flag_reason: string | null
  timestamp: string
  session_id: string | null
  language: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LIMIT = 15

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-MA', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(iso))
}

function truncate(str: string, n: number) {
  return str.length > n ? str.slice(0, n) + '…' : str
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [pagination, setPagination]       = useState<Pagination | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')

  // Filters
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage]                   = useState(1)
  const [flagFilter, setFlagFilter]       = useState<'all' | 'flagged' | 'low'>('all')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [debouncedSession, setDebouncedSession] = useState('')

  // Modal
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [flagNote, setFlagNote]           = useState('')
  const [saving, setSaving]               = useState(false)

  // Stats
  const [stats, setStats] = useState({ total: 0, flagged: 0, lowConf: 0 })

  // ── Debounce search ──────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(t)
  }, [search])

  // ── Debounce session filter ──────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSession(sessionFilter), 400)
    return () => clearTimeout(t)
  }, [sessionFilter])

  // ── Reset page on filter change ──────────────────────────────────────────────
  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, flagFilter, dateFrom, dateTo, debouncedSession])

  // ── Fetch conversations ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        page:   String(page),
        limit:  String(LIMIT),
        search: debouncedSearch,
        ...(flagFilter === 'flagged' ? { flagged: 'true' }        : {}),
        ...(flagFilter === 'low'     ? { low_confidence: 'true' } : {}),
        ...(dateFrom         ? { date_from:  dateFrom         } : {}),
        ...(dateTo           ? { date_to:    dateTo           } : {}),
        ...(debouncedSession ? { session_id: debouncedSession } : {}),
      })
      const res  = await fetch(`/api/admin/conversations?${params}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erreur serveur')
      setConversations(json.data || [])
      setPagination(json.pagination)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, flagFilter, dateFrom, dateTo, debouncedSession])

  useEffect(() => { fetchData() }, [fetchData])

  // ── Fetch stats ──────────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchStats() {
      try {
        const [total, flagged, lowConf] = await Promise.all([
          fetch('/api/admin/conversations?limit=1').then(r => r.json()),
          fetch('/api/admin/conversations?limit=1&flagged=true').then(r => r.json()),
          fetch('/api/admin/conversations?limit=1&low_confidence=true').then(r => r.json()),
        ])
        setStats({
          total:   total.pagination?.total   || 0,
          flagged: flagged.pagination?.total  || 0,
          lowConf: lowConf.pagination?.total  || 0,
        })
      } catch {}
    }
    fetchStats()
  }, [conversations])

  // ── Flag / unflag ────────────────────────────────────────────────────────────
  async function toggleFlag(conv: Conversation) {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/conversations?id=${conv.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          is_flagged:  !conv.is_flagged,
          flag_reason: !conv.is_flagged ? (flagNote || null) : null,
        }),
      })
      if (!res.ok) throw new Error('Échec')
      setSelected(null)
      setFlagNote('')
      fetchData()
    } catch {
      alert('Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  // ── Export CSV ───────────────────────────────────────────────────────────────
  function exportCSV() {
    const params = new URLSearchParams({
      format: 'csv',
      search: debouncedSearch,
      ...(flagFilter === 'flagged' ? { flagged: 'true' }        : {}),
      ...(flagFilter === 'low'     ? { low_confidence: 'true' } : {}),
      ...(dateFrom         ? { date_from:  dateFrom         } : {}),
      ...(dateTo           ? { date_to:    dateTo           } : {}),
      ...(debouncedSession ? { session_id: debouncedSession } : {}),
    })
    window.open(`/api/admin/conversations?${params}`, '_blank')
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* Header */}
      <header className="bg-[#1B3A6B] text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">CRI-RSK — Console Admin</h1>
              <p className="text-blue-200 text-xs">Journalisation des conversations IA</p>
            </div>
          </div>
          <a href="/" className="text-blue-200 hover:text-white text-sm transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au site
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total conversations" value={stats.total}   icon="💬" color="blue"   />
          <StatCard label="Marquées pour révision" value={stats.flagged} icon="🚩" color="orange" />
          <StatCard label="Faible confiance"     value={stats.lowConf} icon="⚠️" color="yellow" />
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Full-text search */}
            <div className="relative lg:col-span-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Rechercher dans les questions et réponses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
              />
            </div>

            {/* Status filter */}
            <select
              value={flagFilter}
              onChange={e => setFlagFilter(e.target.value as 'all' | 'flagged' | 'low')}
              className="py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
            >
              <option value="all">Tous les statuts</option>
              <option value="flagged">🚩 Marquées</option>
              <option value="low">⚠️ Faible confiance</option>
            </select>

            {/* Export button */}
            <button
              onClick={exportCSV}
              className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium bg-[#1B3A6B] text-white rounded-lg hover:bg-[#2E6DB4] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exporter CSV
            </button>

            {/* Date range */}
            <div className="flex gap-2 md:col-span-2">
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-2 text-[10px] text-slate-400 bg-white px-1">Du</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              <div className="flex-1 relative">
                <label className="absolute -top-2 left-2 text-[10px] text-slate-400 bg-white px-1">Au</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full py-2 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                />
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={() => { setDateFrom(''); setDateTo('') }}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-red-500 border border-slate-200 rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Session ID filter */}
            <div className="relative md:col-span-2">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              <input
                type="text"
                placeholder="Filtrer par Session ID  (ex: session_1234567890_abc123)"
                value={sessionFilter}
                onChange={e => setSessionFilter(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-mono"
              />
              {sessionFilter && (
                <button
                  onClick={() => { setSessionFilter(''); setDebouncedSession('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors text-xs"
                >
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Table header info */}
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              {pagination ? `${pagination.total} résultat${pagination.total > 1 ? 's' : ''}` : '…'}
              {debouncedSearch   && ` pour "${debouncedSearch}"`}
              {debouncedSession  && ` · session: ${debouncedSession.slice(0, 24)}…`}
            </span>
            {loading && (
              <span className="text-xs text-blue-500 flex items-center gap-1">
                <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Chargement…
              </span>
            )}
          </div>

          {error ? (
            <div className="p-8 text-center text-red-500 text-sm">❌ {error}</div>
          ) : conversations.length === 0 && !loading ? (
            <div className="p-12 text-center text-slate-400">
              <div className="text-4xl mb-3">💬</div>
              <div className="font-medium">Aucune conversation trouvée</div>
              <div className="text-sm mt-1">Les échanges apparaîtront ici automatiquement</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Question</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Réponse</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-24 text-center">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-20 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {conversations.map(conv => (
                    <tr
                      key={conv.id}
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                        conv.is_flagged ? 'bg-orange-50/40' : conv.is_low_confidence ? 'bg-yellow-50/40' : ''
                      }`}
                      onClick={() => { setSelected(conv); setFlagNote(conv.flag_reason || '') }}
                    >
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(conv.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs">
                        <span className="line-clamp-2">{truncate(conv.question, 120)}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-sm">
                        <span className="line-clamp-2 text-xs">{truncate(conv.answer, 160)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <StatusBadge conv={conv} />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); setSelected(conv); setFlagNote(conv.flag_reason || '') }}
                          className="text-xs text-slate-400 hover:text-[#1B3A6B] transition-colors p-1 rounded"
                          title="Voir détails"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Page {pagination.page} / {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  ← Précédent
                </button>
                <button
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-3 py-1 text-xs border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors"
                >
                  Suivant →
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
              <div className="flex items-center gap-2">
                <StatusBadge conv={selected} />
                <span className="text-sm text-slate-400">{formatDate(selected.timestamp)}</span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question</label>
                <p className="mt-1 text-slate-800 text-sm leading-relaxed bg-slate-50 rounded-lg p-3">
                  {selected.question}
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Réponse</label>
                <p className="mt-1 text-slate-700 text-sm leading-relaxed bg-blue-50/50 rounded-lg p-3 whitespace-pre-wrap">
                  {selected.answer}
                </p>
              </div>

              {selected.source_urls && selected.source_urls.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sources citées</label>
                  <div className="mt-1 space-y-1">
                    {selected.source_urls.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs text-blue-600 hover:text-blue-800 truncate underline-offset-2 hover:underline"
                      >
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Note de révision (optionnelle)
                </label>
                <textarea
                  value={flagNote}
                  onChange={e => setFlagNote(e.target.value)}
                  placeholder="Ajouter une note sur cette conversation..."
                  rows={2}
                  className="mt-1 w-full text-sm border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-400 space-y-0.5">
                <div>Session: <span className="font-mono">{selected.session_id || '—'}</span></div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => toggleFlag(selected)}
                  disabled={saving}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-60 ${
                    selected.is_flagged
                      ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      : 'bg-orange-500 text-white hover:bg-orange-600'
                  }`}
                >
                  {saving ? '…' : selected.is_flagged ? '✓ Retirer le marquage' : '🚩 Marquer pour révision'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: {
  label: string; value: number; icon: string; color: 'blue' | 'orange' | 'yellow'
}) {
  const colors = {
    blue:   'bg-blue-50   border-blue-100   text-[#1B3A6B]',
    orange: 'bg-orange-50 border-orange-100 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-700',
  }
  return (
    <div className={`rounded-xl border p-5 flex items-center gap-4 ${colors[color]}`}>
      <span className="text-3xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm opacity-70">{label}</div>
      </div>
    </div>
  )
}

function StatusBadge({ conv }: { conv: Conversation }) {
  if (conv.is_flagged) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-orange-100 text-orange-700">
      🚩 Marquée
    </span>
  )
  if (conv.is_low_confidence) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-yellow-100 text-yellow-700">
      ⚠️ Incertain
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-green-100 text-green-700">
      ✓ OK
    </span>
  )
}
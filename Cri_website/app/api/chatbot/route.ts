import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// ── Supabase client (uses anon key — safe for server-side Next.js route) ──────
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// ── Low-confidence detection patterns ────────────────────────────────────────
// If the AI reply contains any of these, the row is tagged is_low_confidence=true
const LOW_CONFIDENCE_PATTERNS = [
  "je ne trouve pas",
  "je ne peux pas trouver",
  "cette information n'est pas",
  "n'est pas présente dans",
  "veuillez consulter un représentant",
  "je n'ai pas cette information",
  "cannot find",
  "not available",
  "i cannot find",
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function isLowConfidence(text: string): boolean {
  const lower = text.toLowerCase()
  return LOW_CONFIDENCE_PATTERNS.some((p) => lower.includes(p))
}

function extractSourceUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s\)\]"',]+/g
  const matches  = text.match(urlRegex) || []
  // Keep only cri-invest.ma URLs, deduplicated
  return [...new Set(matches.filter((u) => u.includes("cri-invest.ma")))]
}

async function logConversation(
  question:  string,
  answer:    string,
  sessionId: string
): Promise<void> {
  // Skip silently if Supabase is not configured
  if (!supabaseUrl || !supabaseAnonKey) return

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    await supabase.from("conversations").insert({
      question,
      answer,
      source_urls:       extractSourceUrls(answer),
      is_low_confidence: isLowConfidence(answer),
      session_id:        sessionId,
      language:          "fr",
    })
  } catch (err) {
    // Non-blocking: a logging failure must never break the chat response
    console.error("[chatbot] Supabase logging error:", err)
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { reply: "Le chatbot n'est pas configuré. Veuillez définir N8N_WEBHOOK_URL." },
      { status: 500 }
    )
  }

  let body: { message?: string; sessionId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { reply: "Corps de requête invalide." },
      { status: 400 }
    )
  }

  const question  = body.message?.trim() || ""
  const sessionId = body.sessionId       || `session_${Date.now()}`

  if (!question) {
    return NextResponse.json({ reply: "Message vide." }, { status: 400 })
  }

  // ── Forward to n8n ──────────────────────────────────────────────────────────
  let reply: string
  try {
    const res = await fetch(webhookUrl, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      // n8n AI Agent reads $json.body — keep this key consistent
      body:    JSON.stringify({ body: question, message: question, sessionId }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { reply: "Erreur lors de la communication avec l'assistant." },
        { status: 502 }
      )
    }

    const data = await res.json()

    // n8n can return the reply under different keys depending on the workflow config
    reply =
      typeof data === "string"
        ? data
        : data.output  ||
          data.reply   ||
          data.text    ||
          data.message ||
          JSON.stringify(data)

    if (!reply) throw new Error("Réponse n8n vide")

  } catch {
    return NextResponse.json(
      { reply: "Une erreur est survenue. Veuillez réessayer." },
      { status: 500 }
    )
  }

  // ── Log to Supabase (fire-and-forget — does not block the response) ─────────
  logConversation(question, reply, sessionId)

  return NextResponse.json({ reply, sessionId })
}
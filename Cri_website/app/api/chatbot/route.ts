import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL

  if (!webhookUrl) {
    return NextResponse.json(
      { reply: "Le chatbot n'est pas configure. Veuillez definir N8N_WEBHOOK_URL." },
      { status: 500 }
    )
  }

  try {
    const body = await req.json()

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: body.message }),
    })

    if (!res.ok) {
      return NextResponse.json(
        { reply: "Erreur lors de la communication avec l'assistant." },
        { status: 502 }
      )
    }

    const data = await res.json()

    // n8n can return the reply in various shapes — adapt as needed
    const reply =
      typeof data === "string"
        ? data
        : data.reply || data.output || data.text || data.message || JSON.stringify(data)

    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json(
      { reply: "Une erreur est survenue. Veuillez reessayer." },
      { status: 500 }
    )
  }
}

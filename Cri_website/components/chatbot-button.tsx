"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Copy, Check, ThumbsUp, ThumbsDown } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  role: "user" | "assistant"
  content: string
}

// ── Session management ────────────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  const KEY = "cri_chat_session"
  const existing = sessionStorage.getItem(KEY)
  if (existing) return existing
  const newId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  sessionStorage.setItem(KEY, newId)
  return newId
}

export function ChatbotButton() {
  const [isOpen, setIsOpen]       = useState(false)
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId] = useState<string>(() => getOrCreateSessionId())

  // feedback[i] = 1 (👍) or -1 (👎) — undefined means not yet voted
  const [feedback, setFeedback]   = useState<Record<number, 1 | -1>>({})
  // copied[i] = true for 2s after clicking copy, then resets
  const [copied, setCopied]       = useState<Record<number, boolean>>({})

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // ── Send message ─────────────────────────────────────────────────────────
  async function handleSend() {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: Message = { role: "user", content: trimmed }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, sessionId }),
      })
      if (!res.ok) throw new Error("Erreur serveur")
      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Pas de réponse." },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Désolée, une erreur est survenue. Veuillez réessayer." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Copy handler ──────────────────────────────────────────────────────────
  async function handleCopy(content: string, index: number) {
    try {
      await navigator.clipboard.writeText(content)
      setCopied((prev) => ({ ...prev, [index]: true }))
      setTimeout(() => setCopied((prev) => ({ ...prev, [index]: false })), 2000)
    } catch {
      // Fallback for browsers that block clipboard without HTTPS
      const el = document.createElement("textarea")
      el.value = content
      document.body.appendChild(el)
      el.select()
      document.execCommand("copy")
      document.body.removeChild(el)
      setCopied((prev) => ({ ...prev, [index]: true }))
      setTimeout(() => setCopied((prev) => ({ ...prev, [index]: false })), 2000)
    }
  }

  // ── Feedback handler ──────────────────────────────────────────────────────
  async function handleFeedback(score: 1 | -1, index: number) {
    // Optimistic update — show vote immediately, disable buttons
    setFeedback((prev) => ({ ...prev, [index]: score }))
    try {
      await fetch("/api/chatbot/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, score, messageIndex: index }),
      })
    } catch {
      // Silent fail — the UI already shows the vote, no need to revert
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel */}
      {isOpen && (
        <div className="mb-2 flex h-[480px] w-[370px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-foreground/20">
                <MessageCircle className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-primary-foreground">Assistant CRI</p>
                <p className="text-xs text-primary-foreground/70">En ligne</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-primary-foreground/70 transition-colors hover:bg-primary-foreground/10 hover:text-primary-foreground"
              aria-label="Fermer le chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages area */}
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <MessageCircle className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">Bienvenue sur le chat CRI</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {"Posez vos questions sur les procédures d'investissement, le foncier, ou les incitations."}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  {/* Message bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p:      ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
                          ul:     ({ children }) => <ul className="list-disc pl-4 mt-1 mb-1 space-y-0">{children}</ul>,
                          ol:     ({ children }) => <ol className="list-decimal pl-4 mt-1 mb-1 space-y-0">{children}</ol>,
                          li:     ({ children }) => <li className="leading-snug">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                          h2:     ({ children }) => <p className="font-bold mt-2 mb-1">{children}</p>,
                          h3:     ({ children }) => <p className="font-semibold mt-1 mb-0.5">{children}</p>,
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline underline-offset-2 break-all"
                            >
                              {children}
                            </a>
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Action bar — only for assistant messages */}
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex items-center gap-1 px-1">

                      {/* Copy button */}
                      <button
                        onClick={() => handleCopy(msg.content, i)}
                        className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Copier la réponse"
                        title="Copier"
                      >
                        {copied[i] ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {/* Divider */}
                      <span className="h-3.5 w-px bg-border" />

                      {/* Thumbs up */}
                      <button
                        onClick={() => handleFeedback(1, i)}
                        disabled={feedback[i] !== undefined}
                        className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                          feedback[i] === 1
                            ? "text-green-500"
                            : feedback[i] === -1
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                        }`}
                        aria-label="Réponse utile"
                        title="Utile"
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                      </button>

                      {/* Thumbs down */}
                      <button
                        onClick={() => handleFeedback(-1, i)}
                        disabled={feedback[i] !== undefined}
                        className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                          feedback[i] === -1
                            ? "text-red-400"
                            : feedback[i] === 1
                            ? "text-muted-foreground/30 cursor-not-allowed"
                            : "text-muted-foreground/60 hover:bg-muted hover:text-foreground"
                        }`}
                        aria-label="Réponse inutile"
                        title="Pas utile"
                      >
                        <ThumbsDown className="h-3.5 w-3.5" />
                      </button>

                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-border p-4">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend() }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tapez votre message..."
                className="flex-1 rounded-full border border-input bg-muted/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                disabled={isLoading}
              />
              <button
                type="submit"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Envoyer"
                disabled={!input.trim() || isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95"
        aria-label={isOpen ? "Fermer le chat" : "Ouvrir le chat"}
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform" />
        ) : (
          <MessageCircle className="h-6 w-6 transition-transform" />
        )}
      </button>
    </div>
  )
}
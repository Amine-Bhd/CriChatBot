"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export function ChatbotButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
        body: JSON.stringify({ message: trimmed }),
      })

      if (!res.ok) throw new Error("Erreur serveur")

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply || "Pas de reponse." },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desolee, une erreur est survenue. Veuillez reessayer." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

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
                <p className="text-sm font-semibold text-primary-foreground">
                  Assistant CRI
                </p>
                <p className="text-xs text-primary-foreground/70">
                  En ligne
                </p>
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
                <p className="text-sm font-medium text-foreground">
                  Bienvenue sur le chat CRI
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {"Posez vos questions sur les procedures d'investissement, le foncier, ou les incitations."}
                </p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
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
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
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

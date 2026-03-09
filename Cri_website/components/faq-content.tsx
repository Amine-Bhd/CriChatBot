"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const faqCategories = [
  "Support technique",
  "Preparation de dossier",
  "Soumission des dossiers",
  "Suivi d'avancements des dossiers",
  "Recours",
  "Rendez-vous",
  "Delivrances d'actes",
  "Foncier",
  "Autres informations",
]

const faqItems = [
  {
    question: "Comment creer un compte ?",
    answer: "Pour creer un compte sur la plateforme CRI, rendez-vous sur la page d'inscription en cliquant sur le bouton \"S'inscrire\" en haut a droite de la page. Remplissez le formulaire avec vos informations personnelles et professionnelles, puis validez votre inscription via le lien envoye par email.",
    category: "Support technique",
  },
  {
    question: "Que dois-je faire si je n'arrive pas a me connecter ?",
    answer: "Si vous n'arrivez pas a vous connecter, verifiez d'abord que vos identifiants sont corrects. Si le probleme persiste, essayez de reinitialiser votre mot de passe via le lien \"Mot de passe oublie\". En cas de difficulte persistante, contactez le support technique.",
    category: "Support technique",
  },
  {
    question: "Comment recuperer mon mot de passe ?",
    answer: "Pour recuperer votre mot de passe, cliquez sur le lien \"Mot de passe oublie\" sur la page de connexion. Entrez votre adresse email et un lien de reinitialisation vous sera envoye. Suivez les instructions dans l'email pour definir un nouveau mot de passe.",
    category: "Support technique",
  },
  {
    question: "Que dois-je faire au cas ou l'acces a l'application prend du temps pour repondre ?",
    answer: "Si l'application est lente, essayez de rafraichir la page ou de vider le cache de votre navigateur. Verifiez egalement votre connexion internet. Si le probleme persiste, il peut s'agir d'une maintenance en cours - reessayez ulterieurement.",
    category: "Support technique",
  },
]

export function FaqContent() {
  const [activeCategory, setActiveCategory] = useState("Support technique")
  const [openItem, setOpenItem] = useState<number | null>(null)

  const filteredFaq = faqItems.filter((item) => item.category === activeCategory)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
      <div className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Bonjour, comment pouvons-nous vous aider ?
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          {"Vous pouvez desormais consulter les themes ci-dessous pour trouver ce que vous cherchez"}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {faqCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setActiveCategory(cat)
              setOpenItem(null)
            }}
            className={cn(
              "rounded-full px-4 py-2 text-xs md:text-sm font-medium transition-colors border",
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground border-border hover:border-primary hover:text-primary"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ accordion */}
      <div className="space-y-0 divide-y divide-border">
        {filteredFaq.map((item, idx) => (
          <div key={idx}>
            <button
              onClick={() => setOpenItem(openItem === idx ? null : idx)}
              className="flex w-full items-center justify-between py-5 text-left"
            >
              <span className="text-sm md:text-base font-semibold text-primary pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform",
                  openItem === idx && "rotate-180"
                )}
              />
            </button>
            {openItem === idx && (
              <div className="pb-5 text-sm text-muted-foreground leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
        {filteredFaq.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            {"Aucune question trouvee pour cette categorie."}
          </div>
        )}
      </div>
    </div>
  )
}

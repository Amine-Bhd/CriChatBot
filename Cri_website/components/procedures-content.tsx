"use client"

import { useState } from "react"
import { ArrowLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const categories = [
  "Toutes Categories",
  "Acceptabilite des projets",
  "Foncier",
  "Incitations",
  "Autorisations urbanistiques",
  "Exploitation",
]

type Procedure = {
  title: string
  category: string
}

const procedures: Procedure[] = [
  // Acceptabilite des projets
  { title: "Etude d'impact sur l'environnement", category: "Acceptabilite des projets" },

  // Foncier
  { title: "Autorisation de cession de terrain du domaine prive de l'etat y compris les terrains agricoles ou a vocation agricole et fixation de la valeur venale", category: "Foncier" },
  { title: "Autorisation de location de terrain du domaine prive de l'etat y compris les terrains agricoles ou a vocation agricole et fixation de la valeur venale", category: "Foncier" },
  { title: "AVNA (Attestation de Vocation Non Agricole) provisoire", category: "Foncier" },
  { title: "AVNA (Attestation de Vocation Non Agricole) definitive", category: "Foncier" },
  { title: "Autorisation d'occupation temporaire du domaine public et fixation de la redevance", category: "Foncier" },
  { title: "Autorisation d'occupation temporaire du domaine forestier et fixation de la redevance", category: "Foncier" },
  { title: "Autorisation d'echange immobilier de terrains du domaine forestier", category: "Foncier" },
  { title: "Attribution de lots dans les zones dediees a l'activite economique (zone industrielle, zone d'activites economiques)", category: "Foncier" },

  // Incitations
  { title: "Convention d'Investissement avec le Gouvernement du Royaume du Maroc", category: "Incitations" },
  { title: "Avenant a la Convention d'Investissement avec le Gouvernement du Royaume du Maroc", category: "Incitations" },
  { title: "Convention d'investissement avec l'Etat - Dispositif TPME", category: "Incitations" },

  // Autorisations urbanistiques
  { title: "Autorisation de morceler des terrains a l'interieur d'un perimetre d'irrigation ou de mise en valeur en bour pour la realisation de projets non agricoles", category: "Autorisations urbanistiques" },
  { title: "Investissement en zone littorale non couverte par un document d'urbanisme ou dans une zone sensible", category: "Autorisations urbanistiques" },
  { title: "Permis de construire (hors zone d'acceleration industrielle)", category: "Autorisations urbanistiques" },
  { title: "Autorisation de creer des groupes d'habitations", category: "Autorisations urbanistiques" },
  { title: "Autorisation de lotir", category: "Autorisations urbanistiques" },
  { title: "Autorisation de morceler", category: "Autorisations urbanistiques" },
  { title: "Derogations en matiere d'urbanisme", category: "Autorisations urbanistiques" },
  { title: "Permis d'habiter", category: "Autorisations urbanistiques" },
  { title: "Certificat de conformite", category: "Autorisations urbanistiques" },

  // Exploitation
  { title: "Autorisation d'installation ou d'exercice d'une activite industrielle, commerciale ou de service, dans une zone d'acceleration industrielle d'exportation", category: "Exploitation" },
  { title: "Classement provisoire et Autorisation d'exploitation des etablissements d'hebergement touristique", category: "Exploitation" },
  { title: "Classement d'exploitation des etablissements d'hebergement touristique", category: "Exploitation" },
  { title: "Renouvellement du classement d'exploitation des etablissements d'hebergement touristique", category: "Exploitation" },
  { title: "Autorisation d'exploitation d'une residence immobiliere adossee a un etablissement d'hebergement touristique", category: "Exploitation" },
  { title: "Classement d'un restaurant touristique", category: "Exploitation" },
]

export function ProceduresContent() {
  const [activeCategory, setActiveCategory] = useState("Toutes Categories")

  const filteredProcedures =
    activeCategory === "Toutes Categories"
      ? procedures
      : procedures.filter((p) => p.category === activeCategory)

  const groupedProcedures = filteredProcedures.reduce(
    (groups, procedure) => {
      if (!groups[procedure.category]) {
        groups[procedure.category] = []
      }
      groups[procedure.category].push(procedure)
      return groups
    },
    {} as Record<string, Procedure[]>
  )

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
      {/* Back button + Title */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:bg-secondary transition-colors"
          aria-label="Retour"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-foreground">
          {"Actes et Procedures d'investissement"}
        </h1>
      </div>

      {/* Intro text */}
      <div className="mb-8 space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-5xl">
        <p>
          {"Les procedures liees a l'investissement sont traitees dans le cadre de la Commission Regionale Unifiee d'Investissement (CRUI) conformement aux dispositions reglementaires dictees par la loi 22-24 modifiant et completant la loi 47-18 relative a la reforme des Centres Regionaux d'Investissement et a la creation de la Commission Regionale Unifiee d'Investissement."}
        </p>
        <p>
          {"La CRUI constitue ainsi le cadre unique d'evaluation, d'instruction et de traitement des dossiers d'investissement. A cet effet, elle est chargee de donner un avis, un avis conforme et de statuer sur les demandes d'actes administratifs et d'autorisations necessaires a la realisation des projets d'investissement."}
        </p>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
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

      {/* Procedure groups */}
      <div className="space-y-10">
        {Object.entries(groupedProcedures).map(([category, items]) => (
          <section key={category}>
            <h2 className="text-lg font-bold text-foreground mb-4">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {items.map((procedure, idx) => (
                <Link
                  key={idx}
                  href="#"
                  className="group flex items-start gap-3 rounded-lg border border-border bg-background p-4 hover:border-primary/30 hover:bg-secondary/50 transition-colors"
                >
                  <span className="flex-1 text-sm font-medium text-foreground leading-relaxed">
                    {procedure.title}
                  </span>
                  <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

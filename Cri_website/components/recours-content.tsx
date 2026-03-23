import { ShieldCheck, Scale, CalendarDays, CheckCircle } from "lucide-react"
import Link from "next/link"

export function RecoursContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Section: Pourquoi */}
          <section className="mb-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
                Pourquoi demander un recours ?
              </h1>
            </div>
            <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                {"En cas de decision defavorable de la Commission Regionale Unifiee d'Investissement (CRUI) concernant une ou plusieurs demandes d'actes ou d'autorisations administratives necessaires a la realisation d'un projet d'investissement, l'investisseur dispose d'un droit de recours, conformement aux dispositions de l'article 37 de la loi 22-24."}
              </p>
              <p>{"La procedure de recours se deroule en deux etapes :"}</p>

              <div className="space-y-4 mt-4">
                <div>
                  <h3 className="font-bold text-foreground">1. Recours aupres de M. le Wali de la region</h3>
                  <p className="mt-1">
                    {"L'investisseur peut adresser un recours au "}
                    <strong className="text-foreground">M. le Wali de la region</strong>
                    {" afin de demander un reexamen de son dossier."}
                  </p>
                  <ul className="mt-2 ml-4 space-y-1">
                    <li>{"- Si M. le Wali "}<strong className="text-foreground">confirme la decision de rejet,</strong>{" ou"}</li>
                    <li>{"- En l'absence de reponse "}<strong className="text-foreground">dans les delais reglementaires,</strong>{" l'investisseur peut engager une seconde etape de recours."}</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold text-foreground">2. Saisine de la Commission Ministerielle de Recours</h3>
                  <p className="mt-1">
                    {"L'investisseur peut alors saisir la "}
                    <strong className="text-foreground">Commission Ministerielle des Recours,</strong>
                    {" instituee par l'article 40 de la loi 22-24, pour un nouvel examen de son dossier."}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section: Referentiel juridique */}
          <section className="mb-12">
            <div className="flex items-start gap-4 mb-6">
              <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                <Scale className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary leading-tight">
                {"Quel est le referentiel juridique ?"}
              </h2>
            </div>
            <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                {"Dahir n 1-24-68 du 18 joumada II 1946 (20 decembre 2024) portant promulgation de la loi n 22-24, modifiant et completant la loi n 47-18 relative a la reforme des Centres Regionaux d'Investissement (CRI), encadre la procedure de recours en cas de rejet d'une demande liee a un projet d'investissement. L'article 37 prevoit explicitement :"}
              </p>
              <blockquote className="border-l-4 border-primary/30 pl-4 italic text-muted-foreground/80">
                <p>
                  {"\"Toute decision de rejet emanant de la Commission regionale peut, dans les conditions et selon les modalites fixees par le present article, faire l'objet de recours."}
                </p>
                <p className="mt-2">
                  {"Lorsque l'investisseur concerne conteste la decision de rejet emanant de la Commission regionale, il peut, dans un delai n'excedant pas 15 jours a compter de la date a laquelle cette decision lui a ete notifiee, introduire un recours aupres du M. le Wali de la region.\""}
                </p>
              </blockquote>
            </div>
          </section>

          {/* Rendez-vous */}
          <section className="rounded-xl border border-border bg-background p-6 md:p-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-border bg-secondary">
                <CalendarDays className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-foreground">Prendre rendez-vous</h3>
            </div>
            <div className="space-y-2 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>
                {"Vous pouvez "}
                <Link href="#" className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80">
                  solliciter un rendez-vous
                </Link>
                {" avec votre conseiller afin de :"}
              </p>
              <ul className="ml-4 space-y-1">
                <li>{"- "}<strong className="text-foreground">Affiner votre recherche de foncier,</strong>{" en precisant les caracteristiques et contraintes specifiques a votre projet ;"}</li>
                <li>{"- "}<strong className="text-foreground">Obtenir une meilleure visibilite</strong>{" sur les parcelles disponibles a l'investissement susceptibles de repondre a vos besoins."}</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0">
          <div className="sticky top-24 rounded-xl border border-border bg-background p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <ShieldCheck className="h-4 w-4 text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-foreground">Types de recours</h3>
            </div>

            {/* Type 1 */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <h4 className="font-bold text-sm text-foreground">Recours aupres de M. le Wali de la region</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {"L'investisseur peut adresser un recours au Wali de la region afin de demander un reexamen de son dossier."}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {"M. le Wali de la region statue sur les recours formes contre les decisions de rejet de la Commission regionale Unifiee d'investissement dans un delai n'excedant pas 15 jours a compter de la date de sa saisine."}
              </p>
            </div>

            <div className="h-px bg-border" />

            {/* Type 2 */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                <h4 className="font-bold text-sm text-foreground">Recours aupres de la Commission Ministerielle de Recours</h4>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {"Si M. le Wali confirme la decision de rejet ou en l'absence de reponse dans les delais reglementaires, l'investisseur peut saisir la Commission ministerielle des recours pour un nouvel examen de son dossier."}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {"La Commission ministerielle des recours statue dans un delai n'excedant pas 45 jours a compter de la date de sa saisine."}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

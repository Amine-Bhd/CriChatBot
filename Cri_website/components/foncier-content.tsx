import { MapPin, Handshake, CalendarDays } from "lucide-react"
import Link from "next/link"

export function FoncierContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      {/* Section 1 */}
      <section className="mb-16">
        <div className="flex items-start gap-4 mb-6">
          <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
            <MapPin className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-primary leading-tight text-balance">
            {"Un accompagnement par le CRI des investisseurs dans l'identification et l'acces au foncier pour leurs projets"}
          </h1>
        </div>
        <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-5xl">
          <p>
            {"La loi 22-24 modifiant et completant la loi 47-18 relative a la reforme des Centres Regionaux d'Investissement prevoit un accompagnement soutenu des investisseurs sur le volet foncier par les Centres Regionaux d'Investissement. Cet accompagnement consiste en "}
            <strong className="text-foreground">{"l'accompagnement dans la recherche et l'identification de foncier disponible correspondant au mieux aux besoins de chaque projet d'investissement."}</strong>
            {" La recherche s'effectue sur la base de criteres precis grace a un outil mis a disposition de chaque Directeur de CRI permettant de visualiser une cartographie du foncier public et des zones industrielles disponibles de son ressort territorial pouvant accueillir des projets d'investissement productifs et generateurs d'emplois."}
          </p>
          <p>
            {"La mise a disposition d'informations sur l'ensemble des demarches et procedures a suivre relatives au foncier dans le cadre de projets d'investissement, quel que soit leur niveau de maturite. Le CRI fournit egalement une assistance aux investisseurs dans l'accomplissement de ces procedures et demarches administratives tout au long du processus d'octroi du foncier."}
          </p>
        </div>
      </section>

      {/* Section 2 */}
      <section className="mb-16">
        <div className="flex items-start gap-4 mb-6">
          <div className="mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
            <Handshake className="h-6 w-6 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-primary leading-tight text-balance">
            {"Un partenariat entre les administrations concernees par la question du foncier disponible pour l'investissement"}
          </h2>
        </div>
        <div className="space-y-4 text-sm md:text-base text-muted-foreground leading-relaxed max-w-5xl">
          <p>
            {"La pertinence de l'accompagnement de l'investisseur repose sur la forte collaboration et coordination entre les Centres Regionaux d'Investissement et les differentes administrations, organismes publics et collectivites territoriales engages tant au niveau national que regional. Les administrations partenaires contribuent principalement au niveau de la mise a disposition du foncier pour l'investissement, ainsi qu'au niveau de la conception, mise en oeuvre et enrichissement de l'outil de recherche du foncier sur l'ensemble du territoire permettant de garantir l'acuite de la visibilite sur les parcelles disponibles a l'investissement dans chaque region du Royaume."}
          </p>
        </div>

        {/* Partner logos placeholder */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 rounded-xl border border-border bg-secondary/30 p-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
              <span className="text-xs font-bold text-primary">MEF</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[140px]">{"Ministere de l'Economie et des Finances"}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
              <span className="text-xs font-bold text-primary">MATUH</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[140px]">{"Ministere de l'Amenagement du Territoire"}</p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background border border-border">
              <span className="text-xs font-bold text-primary">MIC</span>
            </div>
            <p className="text-xs text-muted-foreground max-w-[140px]">{"Ministere de l'Industrie et du Commerce"}</p>
          </div>
        </div>
      </section>

      {/* Rendez-vous section */}
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
  )
}

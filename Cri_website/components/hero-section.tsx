import { Cloud, Rocket, HardHat, KeyRound } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const features = [
  {
    icon: Cloud,
    title: "Je me renseigne sur les procedures et incitations",
    href: "/procedures",
  },
  {
    icon: Rocket,
    title: "Je lance mon projet d'investissement",
    href: "#",
  },
  {
    icon: HardHat,
    title: "Je suis l'avancement de mon dossier",
    href: "#",
  },
  {
    icon: KeyRound,
    title: "J'ai acces a mes actes et autorisations",
    href: "#",
  },
]

export function HeroSection() {
  return (
    <section className="relative">
      {/* Hero background */}
      <div className="relative h-[500px] md:h-[560px] overflow-hidden">
        <Image
          src="/images/background.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/40" />
        <div className="relative z-10 flex h-full flex-col justify-center px-4 md:px-8 lg:px-16 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground leading-tight text-balance max-w-3xl">
            Bienvenue sur votre espace investissement
          </h1>
          <div className="mt-6 max-w-4xl space-y-3 text-primary-foreground/90 text-sm md:text-base leading-relaxed">
            <p>
              {"Cet espace est concu pour vous accompagner a chaque etape de votre projet d'investissement, en toute transparence et dans le respect des delais legaux, conformement aux dispositions de la loi 22-24 modifiant et completant la loi 47-18 relative a la reforme des Centres Regionaux d'Investissement."}
            </p>
            <p className="font-medium">
              {"Grace a cette plateforme, vous pouvez :"}
            </p>
            <ul className="space-y-1.5 list-none">
              <li>{"- Vous informer sur les procedures, les incitations et les dispositifs de soutien a l'investissement ;"}</li>
              <li>{"- Deposer votre projet afin qu'il soit etudie et traite dans le cadre de la Commission Regionale Unifiee d'Investissement (CRUI) ;"}</li>
              <li>{"- Suivre en temps reel l'etat d'avancement de votre dossier ;"}</li>
              <li>{"- Acceder a vos actes administratifs et autorisations delivres."}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Feature cards section */}
      <section className="bg-background py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
              VOTRE PLATEFORME CRI EN LIGNE
            </h2>
            <p className="mt-3 text-muted-foreground text-sm md:text-base">
              {"Des procedures simplifiees et 100% en ligne"}
            </p>
            <div className="mt-4 mx-auto h-1 w-16 rounded-full bg-accent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group flex flex-col items-center text-center gap-5 rounded-xl p-8 transition-colors hover:bg-muted"
              >
                <div className="flex h-20 w-20 items-center justify-center">
                  <feature.icon className="h-14 w-14 text-muted-foreground/70 group-hover:text-foreground transition-colors" strokeWidth={1} />
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-relaxed text-balance">
                  {feature.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </section>
  )
}

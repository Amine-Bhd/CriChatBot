import Image from "next/image"

export function CriLogo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/images/logo.png"
      alt="CRI - Centre Regional d'Investissement"
      width={160}
      height={60}
      className={className}
      priority
    />
  )
}

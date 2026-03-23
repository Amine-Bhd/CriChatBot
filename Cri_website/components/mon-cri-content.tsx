"use client"

import { useState } from "react"

const regions = [
  { name: "Tanger-Tetouan-Al Hoceima", x: 38, y: 12 },
  { name: "Oriental", x: 55, y: 18 },
  { name: "Fes-Meknes", x: 42, y: 22 },
  { name: "Rabat-Sale-Kenitra", x: 32, y: 28 },
  { name: "Beni Mellal-Khenifra", x: 40, y: 32 },
  { name: "Casablanca-Settat", x: 33, y: 34 },
  { name: "Marrakech-Safi", x: 36, y: 40 },
  { name: "Draa-Tafilalet", x: 42, y: 38 },
  { name: "Souss-Massa", x: 30, y: 48 },
  { name: "Guelmim-Oued Noun", x: 24, y: 55 },
  { name: "Laayoune-Sakia El Hamra", x: 18, y: 65 },
  { name: "Dakhla-Oued Ed-Dahab", x: 14, y: 78 },
]

export function MonCriContent() {
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-8 text-center">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
        {"Bienvenue a votre plateforme CRI"}
      </h1>
      <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
        {"Vous pouvez desormais avoir acces aux informations relatives a votre centre regional d'investissement en cliquant sur la region concernee par votre projet d'investissement"}
      </p>

      {/* Morocco map representation */}
      <div className="relative mx-auto max-w-lg">
        {/* SVG map of Morocco (simplified) */}
        <svg viewBox="0 0 80 100" className="w-full h-auto" aria-label="Carte du Maroc">
          {/* Morocco outline simplified */}
          <path
            d="M25,5 L45,3 L55,8 L60,15 L55,20 L50,22 L48,28 L45,30 L42,35 L40,40 L38,45 L35,50 L30,55 L25,60 L20,68 L18,72 L15,80 L12,88 L10,95 L8,95 L10,85 L12,78 L14,70 L16,65 L18,60 L20,55 L22,50 L24,45 L26,40 L28,35 L30,28 L28,22 L26,15 L25,10 Z"
            fill="oklch(0.92 0.03 260)"
            stroke="oklch(0.8 0.06 260)"
            strokeWidth="0.5"
            opacity="0.7"
          />
          {/* Region dots */}
          {regions.map((region) => (
            <g key={region.name}>
              <circle
                cx={region.x}
                cy={region.y}
                r={hoveredRegion === region.name ? 2.5 : 1.8}
                fill="oklch(0.55 0.2 260)"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredRegion(region.name)}
                onMouseLeave={() => setHoveredRegion(null)}
              />
              {hoveredRegion === region.name && (
                <text
                  x={region.x + 4}
                  y={region.y + 1}
                  fill="oklch(0.35 0.05 260)"
                  fontSize="2.5"
                  fontWeight="600"
                >
                  {region.name}
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Region label on hover */}
        {hoveredRegion && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg">
            {hoveredRegion}
          </div>
        )}
      </div>

      {/* Region grid */}
      <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {regions.map((region) => (
          <button
            key={region.name}
            className="rounded-lg border border-border bg-background p-3 text-xs font-medium text-foreground hover:border-primary hover:bg-secondary transition-colors text-center"
            onMouseEnter={() => setHoveredRegion(region.name)}
            onMouseLeave={() => setHoveredRegion(null)}
          >
            {region.name}
          </button>
        ))}
      </div>
    </div>
  )
}

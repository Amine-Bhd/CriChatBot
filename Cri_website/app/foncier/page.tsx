import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FoncierContent } from "@/components/foncier-content"

export default function FoncierPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <FoncierContent />
      </main>
      <Footer />
    </div>
  )
}

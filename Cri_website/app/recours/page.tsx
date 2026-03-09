import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RecoursContent } from "@/components/recours-content"

export default function RecoursPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <RecoursContent />
      </main>
      <Footer />
    </div>
  )
}

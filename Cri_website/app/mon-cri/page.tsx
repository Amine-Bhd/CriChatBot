import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { MonCriContent } from "@/components/mon-cri-content"

export default function MonCriPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <MonCriContent />
      </main>
      <Footer />
    </div>
  )
}

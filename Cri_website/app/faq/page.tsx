import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { FaqContent } from "@/components/faq-content"

export default function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <FaqContent />
      </main>
      <Footer />
    </div>
  )
}

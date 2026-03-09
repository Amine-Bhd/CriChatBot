import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ProceduresContent } from "@/components/procedures-content"

export default function ProceduresPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <ProceduresContent />
      </main>
      <Footer />
    </div>
  )
}

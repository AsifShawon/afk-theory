import { Link } from "next-view-transitions"
import { PauseMark } from "@/components/ui/icons"

export default function NotFound() {
  return (
    <section className="grain relative flex min-h-[80svh] flex-col items-center justify-center px-5 pt-16 text-center">
      <PauseMark size={56} className="text-brand-accent" />
      <h1 className="display mt-8 text-6xl md:text-8xl">Page not found</h1>
      <p className="mt-4 max-w-md text-brand-bone/70">This item may have sold out or moved. The full collection is one tap away.</p>
      <Link href="/" className="btn-signal mt-8">
        Back to the collection
      </Link>
    </section>
  )
}

// app/(public)/loading.tsx
import { TourGridSkeleton } from "@/components/tours/tour-grid-skeleton";

const chipClass =
  "h-10 w-24 rounded-full bg-slate-100 animate-pulse";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white pt-4 md:pt-6">
      {/* Hero placeholder */}
      <section className="relative isolate bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="max-w-3xl space-y-4">
            <div className="h-10 w-3/5 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-5 w-4/5 rounded-lg bg-slate-100 animate-pulse" />
            <div className="h-5 w-2/3 rounded-lg bg-slate-100 animate-pulse" />
            <div className="mt-4 h-14 w-full max-w-2xl rounded-2xl bg-slate-100 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Filters placeholder */}
      <section className="sticky top-20 md:top-24 z-40 border-b border-slate-100 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className={chipClass} />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-20 rounded-full bg-slate-100 animate-pulse" />
              <div className="h-10 w-20 rounded-full bg-slate-100 animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Results skeleton */}
      <section className="container mx-auto px-4 py-10">
        <div className="h-7 w-56 rounded bg-slate-100 animate-pulse mb-6" />
        <TourGridSkeleton />
      </section>
    </div>
  );
}

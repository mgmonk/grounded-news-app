import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-xl px-6 py-32 sm:py-40">
        <div className="space-y-16 text-center">
          <h1 className="text-xl font-light uppercase tracking-[0.4em] text-stone-700">
            Grounded
          </h1>

          <div className="space-y-8">
            <p className="text-2xl font-light italic leading-snug text-stone-700">
              The world is a lot right now. Grounded helps you find your footing.
            </p>

            <div className="space-y-3">
              <p className="text-sm leading-relaxed text-stone-500">
                Read today&apos;s headline. Understand your reaction. Leave feeling like yourself
                again — not just a passenger in the news cycle.
              </p>
              <p className="text-xs leading-relaxed text-stone-400">
                Each day, three prompts. Five minutes. Yours to keep.
              </p>
            </div>
          </div>

          <Link
            href="/journal"
            className="inline-block rounded-full bg-stone-700 px-10 py-3 text-xs uppercase tracking-[0.2em] text-stone-100 transition-colors hover:bg-stone-800"
          >
            Get Grounded →
          </Link>
        </div>
      </div>
    </main>
  );
}

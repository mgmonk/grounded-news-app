"use client";

import { useCallback, useEffect, useState } from "react";

type PromptsResponse = {
  headline: string;
  prompts: {
    prompts: string[];
    counterpoint: string;
    emotional_weight: string;
  };
};

const CATEGORIES = ["All", "World", "Politics", "Climate", "Science & Health", "Culture"];

export default function Home() {
  const [category, setCategory] = useState("All");
  const [data, setData] = useState<PromptsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (selectedCategory: string) => {
    setLoading(true);
    setError(null);
    try {
      const query =
        selectedCategory === "All"
          ? ""
          : `?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(`/api/prompts${query}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load prompts");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category);
  }, [load, category]);

  return (
    <main className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-2xl px-6 py-20 sm:py-28">
        <div className="space-y-16">
          <div className="space-y-2 text-center">
            <h1 className="text-xl font-light uppercase tracking-[0.4em] text-stone-700">
              Grounded
            </h1>
            <p className="text-xs tracking-wide text-stone-400">
              Make sense of the news. Find your footing.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`rounded-full border px-4 py-1.5 text-xs tracking-wide transition-colors ${
                  c === category
                    ? "border-stone-400 bg-stone-200 text-stone-700"
                    : "border-stone-300 bg-transparent text-stone-500 hover:border-stone-400 hover:text-stone-700"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {loading && (
            <p className="text-center text-sm text-stone-400">
              Gathering today's news…
            </p>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
              <p className="mb-4">{error}</p>
              <button
                onClick={() => load(category)}
                className="rounded-md border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-100"
              >
                Try again
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-16">
              <header className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-400">
                  Today's headline
                </p>
                <p className="text-sm text-stone-500">{data.headline}</p>
              </header>

              <p className="text-center text-base italic leading-relaxed text-stone-600">
                {data.prompts.emotional_weight}
              </p>

              <ol className="space-y-8">
                {data.prompts.prompts.map((prompt, i) => (
                  <li
                    key={i}
                    className="rounded-xl border border-stone-200 bg-white p-10 shadow-sm"
                  >
                    <div className="mb-4 text-2xl font-light leading-none text-stone-300">
                      {i + 1}
                    </div>
                    <p className="text-lg leading-relaxed text-stone-700">
                      {prompt}
                    </p>
                  </li>
                ))}
              </ol>

              <p className="mx-auto max-w-md text-center text-sm italic leading-relaxed text-stone-500">
                {data.prompts.counterpoint}
              </p>

              <div className="flex justify-center pt-4">
                <button
                  onClick={() => load(category)}
                  className="rounded-full border border-stone-300 bg-transparent px-8 py-2 text-xs uppercase tracking-[0.2em] text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-700"
                >
                  Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

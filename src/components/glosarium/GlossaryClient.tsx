"use client";

import { useMemo, useState } from "react";
import { GLOSSARY_TERMS } from "@/lib/glossary";
import { useLocale } from "@/components/providers/LocaleProvider";

export function GlossaryClient() {
  const { locale, L } = useLocale();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY_TERMS;
    return GLOSSARY_TERMS.filter((item) =>
      item.term.toLowerCase().includes(q)
    );
  }, [query]);

  const byLetter = filtered.reduce<Record<string, typeof GLOSSARY_TERMS>>(
    (acc, item) => {
      if (!acc[item.letter]) acc[item.letter] = [];
      acc[item.letter].push(item);
      return acc;
    },
    {}
  );

  return (
    <>
      <p className="mb-6 text-slate-600">{L.glossarySubtitle}</p>

      <div className="relative mb-10 max-w-xl">
        <svg
          className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="search"
          placeholder={L.searchWords}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-xl border border-slate-200 py-3 pl-12 pr-4 shadow-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {Object.keys(byLetter)
          .sort()
          .map((letter) => (
            <div key={letter}>
              <h2 className="mb-4 text-3xl font-bold text-[#0F172A]">{letter}</h2>
              <div className="space-y-4">
                {byLetter[letter].map((item) => (
                  <div
                    key={item.term}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h3 className="font-semibold text-[#0F172A]">{item.term}</h3>
                    <p className="mt-2 text-sm text-[#475569] leading-relaxed">
                      {locale === "id" ? item.definitionId : item.definitionEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );
}

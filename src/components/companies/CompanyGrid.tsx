"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CompanySummary } from "@/lib/types";
import { EmitenLogo } from "@/components/EmitenLogo";

const getSectorLabel = (sector: string, locale: string) => {
  if (locale === "id") {
    switch (sector) {
      case "Financials":
        return "Keuangan / Perbankan";
      case "Basic Materials":
        return "Pertambangan";
      case "Energy":
        return "Energi";
      case "Consumer Non-Cyclicals":
        return "Konsumer";
      case "Healthcare":
        return "Kesehatan";
      case "Industrials":
        return "Industri";
      default:
        return sector;
    }
  } else {
    switch (sector) {
      case "Financials":
        return "Financials / Banking";
      case "Basic Materials":
        return "Mining / Materials";
      case "Energy":
        return "Energy";
      case "Consumer Non-Cyclicals":
        return "Consumer";
      case "Healthcare":
        return "Healthcare";
      case "Industrials":
        return "Industrials";
      default:
        return sector;
    }
  }
};

export function CompanyGrid({
  companies,
}: {
  companies: CompanySummary[];
}) {
  const { locale, L, withLocale } = useLocale();
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [selectedSector, setSelectedSector] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("HIGHEST_ESG");

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    setActiveQuery(query);
  };

  const uniqueSectors = useMemo(() => {
    return Array.from(new Set(companies.map((c) => c.sector).filter(Boolean))) as string[];
  }, [companies]);

  const filteredAndSorted = useMemo(() => {
    let list = companies;

    // 1. Search Query
    if (activeQuery.trim()) {
      const q = activeQuery.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.ticker.toLowerCase().includes(q) ||
          (c.name && c.name.toLowerCase().includes(q))
      );
    }

    // 2. Sector Filter
    if (selectedSector !== "ALL") {
      list = list.filter((c) => c.sector === selectedSector);
    }

    // 3. ESG Category Filter
    if (selectedCategory !== "ALL") {
      list = list.filter(
        (c) => c.hasScores && c.scores && c.scores.overallLevel === selectedCategory
      );
    }

    // 4. Sort Options
    return [...list].sort((a, b) => {
      if (selectedSort === "HIGHEST_ESG") {
        const scoreA = a.hasScores && a.scores ? a.scores.overall : -1;
        const scoreB = b.hasScores && b.scores ? b.scores.overall : -1;
        return scoreB - scoreA;
      } else if (selectedSort === "LOWEST_ESG") {
        const scoreA = a.hasScores && a.scores ? a.scores.overall : 999;
        const scoreB = b.hasScores && b.scores ? b.scores.overall : 999;
        return scoreA - scoreB;
      } else if (selectedSort === "A_Z") {
        return a.ticker.localeCompare(b.ticker);
      } else if (selectedSort === "Z_A") {
        return b.ticker.localeCompare(a.ticker);
      }
      return 0;
    });
  }, [companies, activeQuery, selectedSector, selectedCategory, selectedSort]);

  return (
    <>
      {/* Search, Filter, and Sort Controls Panel */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
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
              placeholder={L.searchCompany}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-12 pr-4 text-[#0F172A] shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-slate-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 shadow-sm transition cursor-pointer"
          >
            {L.searchButton}
          </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Sector filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "id" ? "Sektor" : "Sector"}
            </label>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[#0F172A] shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition text-sm cursor-pointer"
            >
              <option value="ALL">
                {locale === "id" ? "Semua Sektor" : "All Sectors"}
              </option>
              {uniqueSectors.map((sector) => (
                <option key={sector} value={sector}>
                  {getSectorLabel(sector, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* ESG Category filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "id" ? "Kategori ESG" : "ESG Category"}
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[#0F172A] shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition text-sm cursor-pointer"
            >
              <option value="ALL">
                {locale === "id" ? "Semua Kategori" : "All Categories"}
              </option>
              <option value="HIGH">{locale === "id" ? "Tinggi / Kuat" : "High / Strong"}</option>
              <option value="MEDIUM">{locale === "id" ? "Sedang" : "Medium"}</option>
              <option value="LOW">{locale === "id" ? "Rendah / Lemah" : "Low / Weak"}</option>
            </select>
          </div>

          {/* Sort field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {locale === "id" ? "Urutkan" : "Sort By"}
            </label>
            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 px-3 text-[#0F172A] shadow-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition text-sm cursor-pointer"
            >
              <option value="HIGHEST_ESG">
                {locale === "id" ? "ESG Tertinggi" : "Highest ESG"}
              </option>
              <option value="LOWEST_ESG">
                {locale === "id" ? "ESG Terendah" : "Lowest ESG"}
              </option>
              <option value="A_Z">A-Z</option>
              <option value="Z_A">Z-A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Clickable Company Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {filteredAndSorted.map((c) => {
          return (
            <Link
              key={c.ticker}
              href={withLocale(`/companies/${c.ticker}`)}
              className="flex flex-col items-center rounded-2xl border-2 border-slate-200 bg-white pt-[18px] px-[18px] pb-[16px] shadow-sm hover:shadow-md hover:border-slate-400 hover:-translate-y-0.5 transition-all duration-300 group cursor-pointer h-[210px] w-full"
            >
              <div className="flex flex-col items-center w-full">
                <EmitenLogo ticker={c.ticker} name={c.name} size={52} />
                <p className="mt-[8px] text-center text-xs font-extrabold text-slate-400 uppercase tracking-wide leading-none">
                  {c.ticker}
                </p>
                <p className="mt-1 text-center text-xs text-[#0F172A] font-bold line-clamp-2 h-8 leading-tight w-full overflow-hidden">
                  {c.name || "-"}
                </p>
              </div>

              <div className="mt-auto flex flex-col items-center w-full gap-[8px]">
                {c.hasScores && c.scores ? (
                  <>
                    <span
                      className={`inline-flex items-center justify-center rounded-md py-[4px] px-[10px] text-[10px] font-extrabold border leading-none ${
                        c.scores.overallLevel === "HIGH"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : c.scores.overallLevel === "MEDIUM"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {c.scores.overallLevel === "HIGH"
                        ? L["companyCard.status.strong"]
                        : c.scores.overallLevel === "MEDIUM"
                        ? L["companyCard.status.medium"]
                        : L["companyCard.status.weak"]}
                    </span>
                    <div className="inline-flex items-center gap-1 justify-center rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm border border-slate-900 hover:bg-amber-600 hover:border-amber-600 transition duration-200 cursor-pointer w-full">
                      <span>{L["companyCard.action.view"]}</span>
                      <svg className="w-3 h-3 text-amber-300 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="inline-flex items-center justify-center rounded-md py-[4px] px-[10px] text-[10px] font-extrabold bg-slate-50 text-slate-600 border border-slate-200 leading-none">
                      {L["companyCard.status.notAnalyzed"]}
                    </span>
                    <div className="inline-flex items-center gap-1 justify-center rounded-lg bg-slate-900 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm border border-slate-900 hover:bg-slate-800 hover:border-slate-800 transition duration-200 cursor-pointer w-full">
                      <span>{L["companyCard.action.view"]}</span>
                      <svg className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty State UI */}
      {filteredAndSorted.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-4 bg-slate-50 rounded-2xl border border-slate-200 my-8">
          <svg
            className="w-12 h-12 text-slate-300 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18"
            />
          </svg>
          <p className="font-bold text-slate-700 text-lg">
            {locale === "id" ? "Tidak ada perusahaan yang ditemukan." : "No companies found."}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {locale === "id"
              ? "Coba gunakan kata kunci atau filter lain."
              : "Try using other keywords or filters."}
          </p>
        </div>
      )}
    </>
  );
}

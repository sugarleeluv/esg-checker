"use client";

import { Fragment, useState } from "react";
import type { Locale, TopicScoreRow } from "@/lib/types";
import { useLocale } from "@/components/providers/LocaleProvider";

export function GriChecklistTable({
  topicsByLocale,
  viewMode = "investor",
  type = "COST",
}: {
  topicsByLocale: Record<Locale, TopicScoreRow[]>;
  viewMode?: "investor" | "company";
  type?: "COST" | "BENEFIT";
}) {
  const { locale, L } = useLocale();
  const topics = topicsByLocale[locale];
  const [expanded, setExpanded] = useState<string | null>(null);
  const [pillarFilter, setPillarFilter] = useState<"ALL" | "E" | "S" | "G">("ALL");

  const filtered =
    pillarFilter === "ALL" ? topics : topics.filter((t) => t.pillar === pillarFilter);

  // Helper to remove duplicated indices like "14.1" from start of titles
  const cleanTopicTitle = (title: string) => {
    return title.replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "").trim();
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <h3 className="font-bold text-[#D97706]">
          {type === "BENEFIT" ? L.checklistBenefit : L.checklistCost}
        </h3>
        <div className="flex gap-1 text-xs">
          {(["ALL", "E", "S", "G"] as const).map((p) => {
            const isActive = pillarFilter === p;
            let activeClass = "";
            if (isActive) {
              if (p === "ALL") activeClass = "border-slate-900 bg-slate-900 text-white shadow-sm";
              else if (p === "E") activeClass = "border-emerald-600 bg-emerald-600 text-white shadow-sm";
              else if (p === "S") activeClass = "border-amber-500 bg-amber-500 text-white shadow-sm";
              else if (p === "G") activeClass = "border-rose-600 bg-rose-600 text-white shadow-sm";
            } else {
              activeClass = "border-transparent bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-750";
            }

            return (
              <button
                key={p}
                type="button"
                onClick={() => setPillarFilter(p)}
                className={`rounded-md px-2.5 py-1 font-semibold transition border ${activeClass}`}
              >
                {p}
              </button>
            );
          })}
        </div>
      </div>
      {viewMode === "company" && (
        <p className="px-4 py-2 text-xs text-[#D97706] bg-slate-50 border-b border-slate-100">
          {L.companyViewHint}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-emerald-700 border-b border-slate-100">
            <tr>
              <th className="px-4 py-3 w-24 font-bold">NO</th>
              <th className="px-4 py-3 font-bold">{L.griTopicHeader}</th>
              <th className="px-4 py-3 w-48 text-right pr-6 font-bold">{L.complianceStatusHeader}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => {
              const isReported = row.score >= 2;
              const cleanTitle = cleanTopicTitle(row.title);

              return (
                <Fragment key={row.topicCode}>
                  <tr
                    className="border-t border-slate-100 hover:bg-slate-50/70 transition cursor-pointer"
                    onClick={() =>
                      setExpanded(expanded === row.topicCode ? null : row.topicCode)
                    }
                  >
                    {/* Index / NO column */}
                    <td className="px-4 py-3 font-mono text-xs font-bold text-[#0F172A]">
                      {row.topicCode}
                    </td>
                    
                    {/* Topic Title column */}
                    <td className="px-4 py-3 text-[#0F172A] font-semibold text-sm">
                      {cleanTitle}
                    </td>

                    {/* Status Pemenuhan column */}
                    <td className="px-4 py-3 text-right pr-6">
                      {row.status === "HIGH" && (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 animate-fade-in">
                          {L.high}
                        </span>
                      )}
                      {row.status === "MEDIUM" && (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 animate-fade-in">
                          {L.medium}
                        </span>
                      )}
                      {row.status === "LOW" && (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 animate-fade-in">
                          {L.low}
                        </span>
                      )}
                    </td>
                  </tr>
                  {/* Expanded detail section */}
                  {expanded === row.topicCode && (
                    <tr className="bg-slate-50/40 border-t border-slate-100/50">
                      <td colSpan={3} className="px-4 py-4 text-xs text-[#475569]">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {row.disclosureText && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                                {type === "BENEFIT" ? L.benefit : L.disclosure}
                              </span>
                              <p className="text-[#475569] leading-relaxed font-medium">
                                {row.disclosureText}
                              </p>
                            </div>
                          )}
                          {type === "COST" && row.nominalCost && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                                {L.cost}
                              </span>
                              <p className="text-[#475569] leading-relaxed font-medium">
                                {row.nominalCost}
                              </p>
                            </div>
                          )}
                        </div>
                        {row.rationale && (
                          <div className="mt-3 space-y-1 pt-3 border-t border-slate-100/50">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D97706]">
                              {L.rationale}
                            </span>
                            <p className="text-[#475569] leading-relaxed font-medium">
                              {row.rationale}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

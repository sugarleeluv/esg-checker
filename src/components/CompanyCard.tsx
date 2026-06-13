import Link from "next/link";
import type { CompanySummary, Locale } from "@/lib/types";
import { levelLabel } from "@/lib/scoring";
import { t } from "@/lib/i18n";
import { EmitenLogo } from "./EmitenLogo";

export function CompanyCard({
  company,
  locale,
}: {
  company: CompanySummary;
  locale: Locale;
}) {
  const L = t(locale);

  return (
    <Link
      href={`/companies/${company.ticker}?locale=${locale}`}
      className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <EmitenLogo ticker={company.ticker} name={company.name} size={64} />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-semibold text-emerald-700">{company.ticker}</p>
          <h3 className="font-semibold text-[#0F172A] leading-snug group-hover:text-emerald-900 transition-colors">
            {company.name ?? company.ticker}
          </h3>
          <p className="text-xs text-[#D97706] mt-0.5">
            {company.sector ?? "Mining"} {company.subSector ? `• ${company.subSector}` : ""}
          </p>
          {company.hasScores && company.scores && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#475569]">
              <span className="rounded-md bg-slate-100 px-2 py-0.5">
                E {company.scores.pillars.E.toFixed(1)}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5">
                S {company.scores.pillars.S.toFixed(1)}
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5">
                G {company.scores.pillars.G.toFixed(1)}
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 text-right">
          {company.hasScores && company.scores ? (
            <>
              <p className="text-xs text-[#D97706] uppercase tracking-wide">{L.overall}</p>
              <p className="text-2xl font-bold text-[#0F172A]">
                {company.scores.overall.toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">/ 3.00</p>
              <span
                className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  company.scores.overallLevel === "HIGH"
                    ? "bg-emerald-100 text-emerald-800"
                    : company.scores.overallLevel === "LOW"
                      ? "bg-red-100 text-red-800"
                      : "bg-[#FEF3C7] text-[#92400E]"
                }`}
              >
                {levelLabel(company.scores.overallLevel, locale)}
              </span>
            </>
          ) : (
            <p className="text-xs text-slate-400">{L.noScoreYet}</p>
          )}
        </div>
      </div>
      <p className="mt-4 border-t border-slate-100 pt-3 text-sm font-medium text-emerald-700 group-hover:text-emerald-900">
        {L.viewDetail} →
      </p>
    </Link>
  );
}

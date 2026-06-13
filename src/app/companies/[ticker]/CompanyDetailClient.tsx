"use client";

import Link from "next/link";
import { EmitenLogo } from "@/components/EmitenLogo";
import { ESGPieChart } from "@/components/ui/ESGPieChart";
import { InsightBox } from "@/components/ui/InsightBox";
import { PageBackHeader } from "@/components/ui/PageBackHeader";
import { useLocale } from "@/components/providers/LocaleProvider";
import type { CompanyInsights, Locale } from "@/lib/types";
import type { AggregatedScores } from "@/lib/types";
import { levelLabel, scoreToLevel } from "@/lib/scoring";

interface Props {
  ticker: string;
  name: string | null;
  sector: string | null;
  scores: AggregatedScores | null;
  benefitScores: AggregatedScores | null;
  hasScores: boolean;
  hasBenefitScores: boolean;
  insightsByLocale: Record<Locale, CompanyInsights>;
  profile: {
    subSector: string | null;
    description: string | null;
    listingBoard: string | null;
    address: string | null;
    website: string | null;
  } | null;
}

export function CompanyDetailClient({
  ticker,
  name,
  sector,
  scores,
  benefitScores,
  hasScores,
  hasBenefitScores,
  profile,
}: Props) {
  const { locale, L, withLocale } = useLocale();
  const isId = locale === "id";

  return (
    <div className="space-y-4">
      <PageBackHeader
        title=""
        backPath="/companies"
        rightSlot={
          hasScores && (
            <Link
              href={withLocale(`/companies/${ticker}/score`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-900 bg-[#0F172A] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800"
            >
              {L.viewDetail}
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[720px_1fr] gap-6 items-start">
        {/* Left Column: Company Profile Card + Score Cards */}
        <div className="space-y-4">
          
          {/* Company Profile Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md relative overflow-hidden">
            <div className="flex gap-3 relative z-10">
              <div className="flex shrink-0 items-center justify-center rounded-xl bg-slate-50 p-2 border border-slate-100 shadow-inner self-start">
                <EmitenLogo ticker={ticker} name={name} size={48} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-mono font-bold text-slate-700 border border-slate-200">
                    {ticker}
                  </span>
                </div>

                <h1 className="mt-0.5 text-[22px] font-black tracking-tight text-[#0F172A] leading-tight">
                  {name ?? ticker}
                </h1>

                {/* Metadata Grid */}
                <div className="mt-3 grid gap-2.5 grid-cols-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#D97706]">
                      {isId ? "Sektor" : "Sector"}
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-[#475569] truncate" title={sector ?? ""}>
                      {sector ?? "-"}
                    </p>
                  </div>

                  {profile?.subSector ? (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#D97706]">
                        {isId ? "Subsektor" : "Sub-sector"}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#475569] truncate" title={profile.subSector}>
                        {profile.subSector}
                      </p>
                    </div>
                  ) : (
                    <div></div>
                  )}

                  {profile?.website ? (
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-[#D97706]">
                        {isId ? "Situs" : "Website"}
                      </p>
                      <p className="mt-0.5 text-[11px] font-bold text-[#475569] truncate">
                        <a
                          href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-0.5 text-[#475569] hover:text-[#0F172A] hover:underline transition"
                        >
                          {profile.website.replace(/^https?:\/\/(www\.)?/, "")}
                          <svg className="h-2.5 w-2.5 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                          </svg>
                        </a>
                      </p>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>

                {/* Business Line / Lini Usaha Section */}
                {profile?.description && (
                  <div className="mt-2.5 rounded-lg bg-slate-50/50 p-2.5 border border-slate-100">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#D97706] mb-0.5">
                      {isId ? "Lini Usaha / Deskripsi" : "Business Line / Description"}
                    </p>
                    <p className="text-[11px] text-[#475569] leading-relaxed line-clamp-2">
                      {profile.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Row of 2 Score Cards Side-by-Side */}
          {(() => {
            const renderPillarBadge = (level: "LOW" | "MEDIUM" | "HIGH") => {
              const label = levelLabel(level, locale);
              if (level === "HIGH") {
                return (
                  <span className="inline-block text-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md min-w-[60px]">
                    {label}
                  </span>
                );
              }
              if (level === "MEDIUM") {
                return (
                  <span className="inline-block text-center text-[10px] font-bold text-amber-800 bg-[#FEF3C7] border border-[#FCD34D] px-2 py-0.5 rounded-md min-w-[60px]">
                    {label}
                  </span>
                );
              }
              return (
                <span className="inline-block text-center text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md min-w-[60px]">
                  {label}
                </span>
              );
            };

            const renderScoreCard = (
              title: string,
              subtitle: string,
              activeScores: AggregatedScores | null,
              hasActiveScores: boolean
            ) => {
              return (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between transition hover:shadow-md min-h-[320px]">
                  <div>
                    <h2 className="text-base font-extrabold tracking-tight text-[#0F172A]">{title}</h2>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider leading-none mt-1">{subtitle}</p>
                  </div>
                  
                  {hasActiveScores && activeScores ? (
                    <div className="flex flex-col mt-2 flex-1 justify-between">
                      {/* Gauge and Main Score in Upper Center */}
                      <div className="flex justify-center items-center h-[90px] mt-1 mb-2">
                        <ESGPieChart scores={activeScores} size={120} />
                      </div>
                      
                      {/* Divider */}
                      <div className="border-t border-slate-100 my-3" />

                      {/* Three Indicator Rows */}
                      <div className="space-y-2">
                        {/* E (Lingkungan) */}
                        <div className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#0F172A] text-xs w-3 text-center">E</span>
                            <span className="text-xs text-slate-500 font-medium">
                              {isId ? "Lingkungan" : "Environmental"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {activeScores.pillars.E.toFixed(2)}
                            </span>
                            {renderPillarBadge(activeScores.pillarLevels.E)}
                          </div>
                        </div>

                        {/* S (Sosial) */}
                        <div className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#0F172A] text-xs w-3 text-center">S</span>
                            <span className="text-xs text-slate-500 font-medium">
                              {isId ? "Sosial" : "Social"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {activeScores.pillars.S.toFixed(2)}
                            </span>
                            {renderPillarBadge(activeScores.pillarLevels.S)}
                          </div>
                        </div>

                        {/* G (Tata Kelola) */}
                        <div className="flex items-center justify-between py-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-[#0F172A] text-xs w-3 text-center">G</span>
                            <span className="text-xs text-slate-500 font-medium">
                              {isId ? "Tata Kelola" : "Governance"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-700">
                              {activeScores.pillars.G.toFixed(2)}
                            </span>
                            {renderPillarBadge(activeScores.pillarLevels.G)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 flex-1">
                      <p className="text-slate-500 text-center text-xs">{L.noScoreYet}</p>
                    </div>
                  )}
                </div>
              );
            };

            return (
              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                {renderScoreCard(
                  "ESG Cost Score",
                  isId ? "Komitmen Pendanaan & Transparansi Biaya" : "Cost Commitment & Transparency",
                  scores,
                  hasScores
                )}
                {renderScoreCard(
                  "ESG Benefit Score",
                  isId ? "Realisasi Manfaat & Dampak Nyata" : "Benefit Realization & Real Impact",
                  benefitScores,
                  hasBenefitScores
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Column: Insight Box */}
        <div>
          {(() => {
            const eCost = scores?.pillars?.E ?? 0;
            const eBenefit = benefitScores?.pillars?.E ?? 0;
            const sCost = scores?.pillars?.S ?? 0;
            const sBenefit = benefitScores?.pillars?.S ?? 0;
            const gCost = scores?.pillars?.G ?? 0;
            const gBenefit = benefitScores?.pillars?.G ?? 0;

            const eCostLevel = scoreToLevel(eCost);
            const eBenefitLevel = scoreToLevel(eBenefit);
            const sCostLevel = scoreToLevel(sCost);
            const sBenefitLevel = scoreToLevel(sBenefit);
            const gCostLevel = scoreToLevel(gCost);
            const gBenefitLevel = scoreToLevel(gBenefit);

            const eCostLevelLabel = levelLabel(eCostLevel, locale).toLowerCase();
            const eBenefitLevelLabel = levelLabel(eBenefitLevel, locale).toLowerCase();
            const sCostLevelLabel = levelLabel(sCostLevel, locale).toLowerCase();
            const sBenefitLevelLabel = levelLabel(sBenefitLevel, locale).toLowerCase();
            const gCostLevelLabel = levelLabel(gCostLevel, locale).toLowerCase();
            const gBenefitLevelLabel = levelLabel(gBenefitLevel, locale).toLowerCase();

            const environmentalText = isId
              ? `Pilar Lingkungan memiliki skor Cost sebesar ${eCost.toFixed(2)} (${eCostLevelLabel}) dan Benefit sebesar ${eBenefit.toFixed(2)} (${eBenefitLevelLabel}). Hal ini menunjukkan alokasi biaya inisiatif lingkungan berada pada tingkat ${eCostLevelLabel}, dengan realisasi dampak lingkungan yang tergolong ${eBenefitLevelLabel}.`
              : `The Environmental pillar has a Cost score of ${eCost.toFixed(2)} (${eCostLevelLabel}) and a Benefit score of ${eBenefit.toFixed(2)} (${eBenefitLevelLabel}). This indicates that environmental cost commitment is ${eCostLevelLabel}, while the realized environmental impact is considered ${eBenefitLevelLabel}.`;

            const socialText = isId
              ? `Pilar Sosial mencatat skor Cost sebesar ${sCost.toFixed(2)} (${sCostLevelLabel}) dan Benefit sebesar ${sBenefit.toFixed(2)} (${sBenefitLevelLabel}). Ini mencerminkan pengeluaran untuk kesejahteraan pekerja dan hubungan sosial berada di tingkat ${sCostLevelLabel}, dengan dampak sosial nyata tergolong ${sBenefitLevelLabel}.`
              : `The Social pillar records a Cost score of ${sCost.toFixed(2)} (${sCostLevelLabel}) and a Benefit score of ${sBenefit.toFixed(2)} (${sBenefitLevelLabel}). This reflects that social/labor spending commitment is ${sCostLevelLabel}, with realized social benefits considered ${sBenefitLevelLabel}.`;

            const governanceText = isId
              ? `Pilar Tata Kelola mencatat skor Cost sebesar ${gCost.toFixed(2)} (${gCostLevelLabel}) dan Benefit sebesar ${gBenefit.toFixed(2)} (${gBenefitLevelLabel}). Hal ini mengindikasikan komitmen biaya kepatuhan internal berada pada tingkat ${gCostLevelLabel}, sementara efektivitas tata kelola nyata tergolong ${gBenefitLevelLabel}.`
              : `The Governance pillar has a Cost score of ${gCost.toFixed(2)} (${gCostLevelLabel}) and a Benefit score of ${gBenefit.toFixed(2)} (${gBenefitLevelLabel}). This signifies that internal compliance and governance cost commitment is ${gCostLevelLabel}, while actual governance effectiveness is considered ${gBenefitLevelLabel}.`;

            // Kesimpulan
            const costOverall = scores?.overall ?? 0;
            const benefitOverall = benefitScores?.overall ?? 0;
            const gap = Math.abs(costOverall - benefitOverall).toFixed(2);

            const directionId = benefitOverall >= costOverall
              ? "lebih kuat dibandingkan"
              : "lebih lemah daripada";
            const directionEn = benefitOverall >= costOverall
              ? "stronger than"
              : "weaker than";

            const avgE = (eCost + eBenefit) / 2;
            const avgS = (sCost + sBenefit) / 2;
            const avgG = (gCost + gBenefit) / 2;

            let weakestPillarLabel = isId ? "Lingkungan (E)" : "Environmental (E)";
            let minAvg = avgE;
            if (avgS < minAvg) {
              weakestPillarLabel = isId ? "Sosial (S)" : "Social (S)";
              minAvg = avgS;
            }
            if (avgG < minAvg) {
              weakestPillarLabel = isId ? "Tata Kelola (G)" : "Governance (G)";
              minAvg = avgG;
            }

            const conclusionText = isId
              ? `Secara keseluruhan, Skor Cost ESG tercatat sebesar ${costOverall.toFixed(2)} sedangkan Skor Benefit ESG adalah ${benefitOverall.toFixed(2)}, menunjukkan kesenjangan (gap) sebesar ${gap}. Hal ini mengindikasikan bahwa realisasi manfaat ESG ${directionId} komitmen biaya dan transparansi perusahaan. Pilar ${weakestPillarLabel} harus menjadi prioritas perbaikan utama untuk mengoptimalkan kinerja ESG.`
              : `Overall, the ESG Cost Score is ${costOverall.toFixed(2)} while the ESG Benefit Score is ${benefitOverall.toFixed(2)}, showing a gap of ${gap}. This indicates that the realized ESG benefits are ${directionEn} the cost commitment and transparency of the company. The ${weakestPillarLabel} pillar should be the main improvement priority to optimize overall ESG performance.`;

            return (
              <InsightBox>
                {hasScores && scores && hasBenefitScores && benefitScores ? (
                  <div className="flex flex-col gap-3.5 text-xs text-[#475569] leading-relaxed">
                    {/* Section 1: Analisis Pilar */}
                    <div className="space-y-2">
                      <h4 className="text-[9px] font-bold text-[#D97706] uppercase tracking-widest">
                        {isId ? "Analisis Pilar" : "Pillar Analysis"}
                      </h4>
                      <div className="flex flex-col gap-2.5">
                        <div className="border-l-2 border-emerald-500 pl-2">
                          <p className="font-bold text-[#0F172A] text-[11px] leading-snug">
                            {isId ? "Environmental (E) - Lingkungan" : "Environmental (E)"}:
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#475569] leading-relaxed">
                            {environmentalText}
                          </p>
                        </div>

                        <div className="border-l-2 border-sky-500 pl-2">
                          <p className="font-bold text-[#0F172A] text-[11px] leading-snug">
                            {isId ? "Social (S) - Sosial" : "Social (S)"}:
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#475569] leading-relaxed">
                            {socialText}
                          </p>
                        </div>

                        <div className="border-l-2 border-indigo-500 pl-2">
                          <p className="font-bold text-[#0F172A] text-[11px] leading-snug">
                            {isId ? "Governance (G) - Tata Kelola" : "Governance (G)"}:
                          </p>
                          <p className="mt-0.5 text-[11px] text-[#475569] leading-relaxed">
                            {governanceText}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Kesimpulan */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-2.5">
                      <h4 className="text-[9px] font-bold text-[#D97706] uppercase tracking-widest">
                        {isId ? "Kesimpulan" : "Conclusion"}
                      </h4>
                      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex gap-2.5 items-start">
                        <svg className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                        <p className="text-[11px] text-[#475569] leading-relaxed font-semibold flex-1">
                          {conclusionText}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 py-6 text-center text-xs">{L.noScoreYet}</p>
                )}
              </InsightBox>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

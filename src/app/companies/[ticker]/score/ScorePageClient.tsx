"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import { PageBackHeader } from "@/components/ui/PageBackHeader";
import { GriChecklistTable } from "@/components/GriChecklistTable";
import { InsightPanel } from "@/components/InsightPanel";
import type { AggregatedScores, CompanyInsights, Locale, TopicScoreRow } from "@/lib/types";

export function ScorePageClient({
  ticker,
  name,
  costTopicsByLocale,
  benefitTopicsByLocale,
  insightsByLocale,
  scores,
}: {
  ticker: string;
  name: string | null;
  costTopicsByLocale: Record<Locale, TopicScoreRow[]>;
  benefitTopicsByLocale: Record<Locale, TopicScoreRow[]>;
  insightsByLocale: Record<Locale, CompanyInsights>;
  scores: AggregatedScores;
}) {
  const { L } = useLocale();

  return (
    <>
      <PageBackHeader title={L.dataScore} backPath={`/companies/${ticker}`} />
      <p className="mb-6 text-slate-600">
        {name} ({ticker}) - {L.checklist}
      </p>

      <div className="space-y-10">
        <GriChecklistTable topicsByLocale={costTopicsByLocale} type="COST" />
        <GriChecklistTable topicsByLocale={benefitTopicsByLocale} type="BENEFIT" />
      </div>

      <div className="mt-10">
        <InsightPanel
          insightsByLocale={insightsByLocale}
          scores={scores}
          ticker={ticker}
        />
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AskAIFab } from "@/components/ui/AskAIFab";
import { ScorePageClient } from "./ScorePageClient";
import { getCompanyDetail } from "@/lib/companies";

export default async function CompanyScorePage({
  params,
}: {
  params: Promise<{ ticker: string }>;
}) {
  const { ticker } = await params;

  const [detailId, detailEn] = await Promise.all([
    getCompanyDetail(ticker, "id"),
    getCompanyDetail(ticker, "en"),
  ]);

  const company = detailId ?? detailEn;
  if (!company || !company.hasScores || !company.scores) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 pt-4 pb-8 lg:px-8">
        <ScorePageClient
          ticker={company.ticker}
          name={company.name}
          scores={company.scores}
          costTopicsByLocale={{
            id: detailId?.costTopics ?? detailEn!.costTopics,
            en: detailEn?.costTopics ?? detailId!.costTopics,
          }}
          benefitTopicsByLocale={{
            id: detailId?.benefitTopics ?? detailEn!.benefitTopics,
            en: detailEn?.benefitTopics ?? detailId!.benefitTopics,
          }}
          insightsByLocale={{
            id: detailId?.insights ?? detailEn!.insights,
            en: detailEn?.insights ?? detailId!.insights,
          }}
        />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}

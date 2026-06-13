export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

import { AskAIFab } from "@/components/ui/AskAIFab";
import { CompanyDetailClient } from "./CompanyDetailClient";
import { getCompanyDetail } from "@/lib/companies";

export default async function CompanyPage({
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
  if (!company) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1160px] flex-1 px-4 pt-4 pb-8 lg:px-8">

        <CompanyDetailClient
          ticker={company.ticker}
          name={company.name}
          sector={company.sector}
          scores={company.scores}
          benefitScores={company.benefitScores}
          hasScores={company.hasScores}
          hasBenefitScores={company.hasBenefitScores}
          insightsByLocale={{
            id: detailId?.insights ?? detailEn!.insights,
            en: detailEn?.insights ?? detailId!.insights,
          }}
          profile={
            company.profile
              ? {
                  subSector: company.profile.subSector,
                  description:
                    company.profile.idxRaw &&
                    typeof company.profile.idxRaw === "object" &&
                    "description" in company.profile.idxRaw
                      ? (company.profile.idxRaw as Record<string, string>).description
                      : null,
                  listingBoard: company.profile.listingBoard,
                  address: company.profile.address,
                  website: company.profile.website,
                }
              : null
          }
        />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}

export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AskAIFab } from "@/components/ui/AskAIFab";
import { ComparePageContent } from "@/components/compare/ComparePageContent";
import { getAllCompaniesForComparison } from "@/lib/companies";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ tickers?: string }>;
}) {
  const { tickers: tickersParam } = await searchParams;
  const initialTickers = tickersParam
    ? tickersParam.split(",").map((t) => t.trim().toUpperCase())
    : [];

  const { companies, allTopics } = await getAllCompaniesForComparison();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl flex-1 px-4 pt-4 pb-8 lg:px-8">
        <ComparePageContent
          companies={companies}
          allTopics={allTopics}
          initialTickers={initialTickers}
        />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}

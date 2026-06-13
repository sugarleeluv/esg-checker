export const dynamic = "force-dynamic";

import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { CompaniesPageIntro } from "@/components/companies/CompaniesPageIntro";
import { AskAIFab } from "@/components/ui/AskAIFab";
import { CompanyGrid } from "@/components/companies/CompanyGrid";
import { listCompanies } from "@/lib/companies";
import { withTimeout } from "@/lib/fetch-with-timeout";

export default async function CompaniesPage() {
  let companies: Awaited<ReturnType<typeof listCompanies>> = [];
  try {
    companies = await withTimeout(listCompanies(), 10_000);
  } catch {
    companies = [];
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl flex-1 px-4 pt-4 pb-8 lg:px-8">
        <CompaniesPageIntro />
        <CompanyGrid companies={companies} />
      </main>
      <SiteFooter />
      <AskAIFab />
    </>
  );
}

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

  let companies: any[] = [];
  let allTopics: any[] = [];
  let errorMsg: string | null = null;

  try {
    const res = await getAllCompaniesForComparison();
    companies = res.companies;
    allTopics = res.allTopics;
  } catch (err: any) {
    console.error("Database connection error in ComparePage:", err);
    errorMsg = err?.message || String(err);
  }

  if (errorMsg) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto max-w-6xl flex-1 px-4 pt-16 pb-8 lg:px-8">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
              </svg>
              <h2 className="text-lg font-bold">Database Connection Error</h2>
            </div>
            <p className="text-sm font-semibold mb-2 text-slate-700">Terdapat kendala koneksi ke database di Vercel:</p>
            <pre className="bg-white/80 border border-red-100 p-4 rounded-xl text-xs font-mono break-all overflow-x-auto text-red-700 leading-relaxed">
              {errorMsg}
            </pre>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed">
              * Tips: Pastikan variabel lingkungan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">DATABASE_URL</code> di dashboard Vercel Anda sudah terisi dengan benar (tidak ada spasi/kurung sudut) dan lakukan <strong>Redeploy</strong> setelah menyimpannya.
            </p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

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

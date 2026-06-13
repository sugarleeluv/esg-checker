import Link from "next/link";
import type { CompanySummary, Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { CompanyCard } from "./CompanyCard";

export function CompaniesSection({
  locale,
  companies,
  error,
  dbHint,
}: {
  locale: Locale;
  companies: CompanySummary[];
  error: boolean;
  dbHint?: string | null;
}) {
  const L = t(locale);

  return (
    <section id="emiten-idx" className="scroll-mt-24 pt-4">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">
            {L.companiesSectionTitle}
          </h2>
          <p className="mt-2 max-w-2xl text-[#475569]">{L.companiesSectionSubtitle}</p>
          <p className="mt-1 text-xs text-[#D97706] font-semibold">{L.kehatiNote}</p>
        </div>
        {companies.length >= 2 && (
          <Link
            href={`/compare?tickers=${companies.map((c) => c.ticker).join(",")}&locale=${locale}`}
            className="shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
          >
            {L.compare} →
          </Link>
        )}
      </div>

      {error || companies.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          {dbHint && <p className="mb-3 font-medium text-red-800">{dbHint}</p>}
          <p>{L.noData}</p>
          <pre className="mt-3 rounded bg-white p-3 text-xs text-[#475569] overflow-x-auto">
            npx prisma dev -d{"\n"}npm run db:push{"\n"}npm run db:seed{"\n"}npm run sync:all
          </pre>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {companies.map((c) => (
            <CompanyCard key={c.ticker} company={c} locale={locale} />
          ))}
        </div>
      )}
    </section>
  );
}

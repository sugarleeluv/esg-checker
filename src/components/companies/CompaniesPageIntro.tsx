"use client";

import { PageBackHeader } from "@/components/ui/PageBackHeader";
import { useLocale } from "@/components/providers/LocaleProvider";

export function CompaniesPageIntro() {
  const { L } = useLocale();

  return (
    <>
      <PageBackHeader title={L.companiesPageTitle} backPath="/" />
      <p className="mb-6 text-slate-600">{L.companiesPageSubtitle}</p>
    </>
  );
}

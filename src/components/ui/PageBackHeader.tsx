"use client";

import Link from "next/link";
import { useLocale } from "@/components/providers/LocaleProvider";

export function PageBackHeader({
  title,
  backPath,
  rightSlot,
}: {
  title: string;
  backPath: string;
  rightSlot?: React.ReactNode;
}) {
  const { L, withLocale } = useLocale();

  return (
    <header className={`flex items-center justify-between gap-4 border-b border-slate-200 ${title ? "mb-5 pb-4" : "mb-3 pb-2"}`}>
      <div className="flex items-center gap-4">
        <Link
          href={withLocale(backPath)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
          aria-label={L.back}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        {title ? (
          <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">{title}</h1>
        ) : null}
      </div>
      {rightSlot}
    </header>
  );
}

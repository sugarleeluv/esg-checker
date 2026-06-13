"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/providers/LocaleProvider";

export function InsightBox({
  text,
  className = "",
  children,
}: {
  text?: string;
  className?: string;
  children?: ReactNode;
}) {
  const { L } = useLocale();

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 md:p-5 shadow-sm ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#0F172A] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v.75m0 0a1.5 1.5 0 1 1-3 0h3ZM12 18a6 6 0 1 0-6-6c0 1.94.927 3.667 2.37 4.757L8.75 18h6.5l-.38-1.243A5.973 5.973 0 0 0 18 12Z" />
        </svg>
        <h3 className="font-bold text-[#0F172A]">{L.insight}</h3>
      </div>
      {children ? children : <p className="text-sm leading-relaxed text-slate-600">{text}</p>}
    </div>
  );
}

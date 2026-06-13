"use client";

import { useLocale } from "@/components/providers/LocaleProvider";
import Image from "next/image";

export function SiteFooter() {
  const { L } = useLocale();

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 flex flex-col items-center gap-4 text-center text-xs text-slate-500 leading-relaxed">
        <div className="flex items-center gap-2">
          <div className="relative w-7 h-7 overflow-hidden rounded-md bg-emerald-50/50 p-0.5 border border-emerald-100/60 flex items-center justify-center shadow-sm">
            <Image
              src="/logo-esg-checker.png"
              alt="ESG Checker Logo"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-700">
            {L.heroTitle}
          </span>
        </div>
        <div>
          <p>{L.disclaimer}</p>
          <p className="mt-2 text-[10px] text-slate-400">{L.footerTagline}</p>
        </div>
      </div>
    </footer>
  );
}

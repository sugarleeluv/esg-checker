"use client";

import Link from "next/link";
import Image from "next/image";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { useLocale } from "@/components/providers/LocaleProvider";

export function SiteHeader() {
  const { L, withLocale } = useLocale();

  return (
    <header className="border-b border-slate-200 bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 lg:px-8">
        <Link
          href={withLocale("/")}
          className="flex items-center gap-2.5 group hover:opacity-95 transition-opacity"
        >
          <div className="relative w-9 h-9 overflow-hidden rounded-lg bg-emerald-50/50 p-0.5 border border-emerald-100/80 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo-esg-checker.png"
              alt="ESG Checker Logo"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">
            {L.heroTitle}
          </span>
        </Link>
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link href={withLocale("/")} className="text-slate-600 hover:text-emerald-800">
            {L.navHome}
          </Link>
          <Link
            href={withLocale("/companies")}
            className="text-slate-600 hover:text-emerald-800"
          >
            {L.navCompanies}
          </Link>
          <Link
            href={withLocale("/compare", { tickers: "MDKA,ANTM" })}
            className="text-slate-600 hover:text-emerald-800"
          >
            {L.compare}
          </Link>
          <Link
            href={withLocale("/glosarium")}
            className="text-slate-600 hover:text-emerald-800"
          >
            {L.glossaryTitle}
          </Link>
          <LocaleSwitcher />
        </nav>
      </div>
    </header>
  );
}

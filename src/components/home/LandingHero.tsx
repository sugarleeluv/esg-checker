"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "@/components/providers/LocaleProvider";

export function LandingHero() {
  const { locale, L, withLocale } = useLocale();

  return (
    <section className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16 py-12 lg:py-20">
      {/* Left Column: Headline and CTA (take 7 cols on large, full on small) */}
      <div className="space-y-6 lg:col-span-7">
        {/* Small badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 shadow-sm uppercase tracking-wider">
          <Image
            src="/logo-esg-checker.png"
            alt="ESG Checker Logo"
            width={16}
            height={16}
            className="object-contain"
          />
          {L.landingEyebrow}
        </div>

        {/* Main headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-tight">
          {L.landingHeroTitle}
        </h1>

        {/* Supporting text */}
        <p className="max-w-xl text-base md:text-lg leading-relaxed text-[#64748B] font-normal">
          {L.landingHeroBody}
        </p>

        {/* CTA Button */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href={withLocale("/companies")}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 text-white px-8 py-3.5 text-md font-bold shadow-md hover:shadow-lg transition-all duration-200 hover:bg-slate-800 border-2 border-transparent hover:border-amber-400 active:scale-[0.98]"
          >
            {L.startAnalysis}
            <svg
              className="w-4 h-4 ml-2 text-white shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        {/* Three checkmark trust indicators */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs md:text-sm font-bold text-slate-500 mt-6 pt-5 border-t border-slate-100">
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4.5 h-4.5 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {locale === "id" ? "Kerangka ESG" : "ESG Framework"}
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4.5 h-4.5 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {locale === "id" ? "Perbandingan Peer" : "Peer Comparison"}
          </span>
          <span className="flex items-center gap-1.5">
            <svg
              className="w-4.5 h-4.5 text-amber-500 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {locale === "id" ? "Penilaian Transparan" : "Transparent Assessment"}
          </span>
        </div>
      </div>

      {/* Right Column: Premium Fintech / Analytics Visualization (take 5 cols) */}
      <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative">
        <div className="relative w-full max-w-md aspect-[4/3] flex items-center justify-center bg-slate-50 border border-slate-200/50 rounded-3xl p-6 overflow-hidden shadow-inner group">
          {/* Abstract Grid background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />

          {/* Abstract Background Gradient Glows */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />

          {/* Main workflow graphic and floating cards */}
          <div className="relative w-full h-full flex flex-col justify-between p-2 space-y-4">
            
            {/* Top Card: Assessment Workflow Panel */}
            <div className="self-start w-11/12 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-2xl p-4 transform -rotate-1 hover:rotate-0 transition duration-500 translate-y-2">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                    {locale === "id" ? "ANALISIS DISCLOSURE" : "DISCLOSURE ANALYSIS"}
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-slate-400 font-mono">GRI 14 Framework</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">
                    {locale === "id" ? "Kebijakan Air & Efluen" : "Water & Effluents Policy"}
                  </span>
                  <span className="text-[9px] font-bold text-[#065F46] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                    {locale === "id" ? "Sesuai" : "Compliant"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">
                    {locale === "id" ? "Laporan Emisi GRK" : "GHG Emissions Report"}
                  </span>
                  <span className="text-[9px] font-bold text-[#92400E] bg-[#FEF3C7] px-1.5 py-0.5 rounded">
                    {locale === "id" ? "Parsial" : "Partial"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">
                    {locale === "id" ? "Prosedur Antikorupsi" : "Anti-Corruption Procedures"}
                  </span>
                  <span className="text-[9px] font-bold text-[#065F46] bg-[#D1FAE5] px-1.5 py-0.5 rounded">
                    {locale === "id" ? "Sesuai" : "Compliant"}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Graphic: Interactive line/area chart representation */}
            <div className="flex-1 w-full flex items-center justify-center py-1">
              <svg className="w-full h-20 overflow-visible" viewBox="0 0 400 100" fill="none">
                {/* Grid Lines */}
                <line x1="0" y1="20" x2="400" y2="20" stroke="#e2e8f0" strokeWidth="0.75" />
                <line x1="0" y1="50" x2="400" y2="50" stroke="#e2e8f0" strokeWidth="0.75" />
                <line x1="0" y1="80" x2="400" y2="80" stroke="#e2e8f0" strokeWidth="0.75" />

                {/* Area path */}
                <path
                  d="M 0 90 Q 50 30, 100 60 T 200 40 T 300 70 T 400 30 L 400 100 L 0 100 Z"
                  fill="url(#gradient-area)"
                  className="opacity-40"
                />

                {/* Line path */}
                <path
                  d="M 0 90 Q 50 30, 100 60 T 200 40 T 300 70 T 400 30"
                  stroke="url(#gradient-line)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Glowing Dots */}
                <circle cx="200" cy="40" r="5" fill="#f59e0b" className="animate-ping" />
                <circle cx="200" cy="40" r="3.5" fill="#f59e0b" />
                <circle cx="300" cy="70" r="3.5" fill="#10b981" />

                {/* Gradients */}
                <defs>
                  <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#3B82F6" />
                  </linearGradient>
                  <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FEF3C7" />
                    <stop offset="100%" stopColor="#ffffff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Bottom Card: Floating Insights Panel */}
            <div className="self-end w-11/12 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-2xl p-4 transform rotate-1 hover:rotate-0 transition duration-500 -translate-y-2">
              <div className="flex items-center gap-2 mb-1.5">
                <svg
                  className="w-4.5 h-4.5 text-amber-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.904-4.473L19.5 8.25 12 5.25z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 10.5h.008v.008H9V10.5z" />
                </svg>
                <span className="text-[10px] font-bold text-[#0F172A] tracking-wider uppercase">
                  {locale === "id" ? "INSIGHT MATERIALITAS" : "MATERIALITY INSIGHTS"}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                {locale === "id"
                  ? "Identifikasi gap pelaporan emiten secara real-time berdasarkan matriks materialitas standar global."
                  : "Identify issuer reporting gaps in real-time based on global standard materiality matrices."}
              </p>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

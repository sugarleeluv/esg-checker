"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function LandingFeatures() {
  const { L } = useLocale();

  const cards = [
    {
      title: L.featureIntegratedTitle,
      desc: L.featureIntegratedDesc,
      icon: (
        <svg className="w-7 h-7 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 0 1 3 18.375v-5.25ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h-2.25c-.621 0-1.125.504-1.125 1.125v9.75c0 .621.504 1.125 1.125 1.125h2.25a1.125 1.125 0 0 0 1.125-1.125v-9.75ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v14.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
        </svg>
      ),
    },
    {
      title: L.featureChecklistTitle,
      desc: L.featureChecklistDesc,
      icon: (
        <svg className="w-7 h-7 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      title: L.featurePeerTitle,
      desc: L.featurePeerDesc,
      icon: (
        <svg className="w-7 h-7 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17M3 12h18M6 12l2 6h-4l2-6Zm12 0l2 6h-4l2-6Z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="border-t border-slate-200 py-16 lg:py-24 space-y-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-[#D97706]">
            {L.analyzePerformanceTitle}
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed font-normal">
            {L.analyzePerformanceDesc}
          </p>
        </div>
        <div className="space-y-3">
          <h2 className="text-xl md:text-2xl font-bold text-[#D97706]">
            {L.driveTransparencyTitle}
          </h2>
          <p className="text-base text-[#64748B] leading-relaxed font-normal">
            {L.driveTransparencyDesc}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-2xl border border-[#E2E8F0] bg-[#FFFFFF] p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition duration-200 flex flex-col justify-between"
          >
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                {card.icon}
              </div>
              <h3 className="mt-5 font-bold text-lg text-[#0F172A] tracking-tight">
                {card.title}
              </h3>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed font-medium">
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

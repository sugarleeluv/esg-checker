"use client";

import type { ReactNode } from "react";
import type { CompanyInsights, Locale, AggregatedScores } from "@/lib/types";
import { useLocale } from "@/components/providers/LocaleProvider";
import { levelLabel } from "@/lib/scoring";

function cleanTopicTitle(title: string): string {
  return title.replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "").trim();
}

function parseActionPoint(point: string): { text: string; code: string | null } {
  const match = point.match(/\(GRI\s*(14\.\d+)\)/i);
  if (match) {
    const code = match[1];
    let text = point.replace(/\(GRI\s*14\.\d+\)/i, "").trim();
    text = text.replace(/\s+\./g, ".").replace(/\.+$/g, ".");
    return { text, code };
  }
  return { text: point, code: null };
}

/*
function getTopicIcon(topicCode: string): ReactNode {
  const code = topicCode.trim().split(" ")[0];
  const className = "w-4.5 h-4.5 text-[#64748B] shrink-0";
  const strokeWidth = 1.5;

  switch (code) {
    case "14.1": // Emisi GRK
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a5.25 5.25 0 0 0 10.3 1.5 4.5 4.5 0 0 0 7.95-3.75 5.25 5.25 0 0 0-9.75-3.75 5.25 5.25 0 0 0-8.5 6Z" />
        </svg>
      );
    case "14.2": // Adaptasi Iklim
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </svg>
      );
    case "14.3": // Emisi Udara
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5h16.5m-16.5-3h16.5m-16.5 6h16.5M12 3v6" />
        </svg>
      );
    case "14.4": // Keanekaragaman Hayati
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M12 3c3 3 6 4 6 8.5C18 16 15 19 12 21c-3-2-6-5-6-9.5C6 7 9 6 12 3Z" />
        </svg>
      );
    case "14.5": // Limbah
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
        </svg>
      );
    case "14.6": // Endapan (Tailings)
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m11.142 0L21.75 12l-4.179-2.25m-11.142 0L12 7.5l4.179 2.25m-8.358 4.5L12 16.5l4.179-2.25m-8.358 4.5L12 21l4.179-2.25" />
        </svg>
      );
    case "14.7": // Air dan Efluen
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
        </svg>
      );
    case "14.8": // Penutupan & Rehabilitasi
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      );
    case "14.9": // Dampak Ekonomi
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      );
    case "14.10": // Komunitas Lokal
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      );
    case "14.11": // Hak-Hak Masyarakat Adat
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
      );
    case "14.12": // Hak atas tanah dan sumber daya
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.89-1.63A1.125 1.125 0 0 0 21 14.98V4.87a1.125 1.125 0 0 0-1.107-1.12l-5.11 1.702c-.352.118-.734.118-1.086 0L8.598 3.75a1.125 1.125 0 0 0-1.086 0L2.622 5.38a1.125 1.125 0 0 0-.622 1.01v10.11c0 .484.31.91.766 1.052l4.89 1.63a1.125 1.125 0 0 0 1.086 0l5.11-1.702a1.125 1.125 0 0 1 1.086 0Z" />
        </svg>
      );
    case "14.13": // Pertambangan Rakyat
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.67 2.67 0 1 0 21 17.25l-5.83-5.83m-3.75 3.75a3.75 3.75 0 1 1-5.3-5.3 3.75 3.75 0 0 1 5.3 5.3Zm6.408-9.083l-1.957 1.957m-1.41-1.41l-1.957 1.957M16.5 7.5L18 6" />
        </svg>
      );
    case "14.14": // Praktik keamanan
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      );
    case "14.15": // Manajemen krisis
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75v-.7V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>
      );
    case "14.16": // Kesehatan dan keselamatan kerja
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296a3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043a3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12z" />
        </svg>
      );
    case "14.17": // Praktik Ketenagakerjaan
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
        </svg>
      );
    case "14.18": // Hak Pekerja (14.18 s/d 14.20)
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .621-.504 1.125-1.125 1.125H4.875A1.125 1.125 0 0 1 3.75 18.4V14.15m16.5 0a9.003 9.003 0 0 0-16.5 0m16.5 0L19.5 9.75A2.25 2.25 0 0 0 17.25 7.5h-10.5A2.25 2.25 0 0 0 4.5 9.75l-.75 4.4m16.5 0h-16.5m10.5-4.4a1.125 1.125 0 0 0-2.25 0V7.5h2.25v1.865Z" />
        </svg>
      );
    case "14.21": // Nondiskriminasi dan peluang kesetaraan
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17m0 0H9m3 0h3M4 9h16M12 3L4 9m8-6l8 6M6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      );
    case "14.22": // Antikorupsi
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3Z" />
        </svg>
      );
    case "14.23": // Pembayaran Pemerintah
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M3.75 21v-8.25M20.25 21v-8.25M2.25 21h19.5M3 12.75h18L12 3 3 12.75Z" />
        </svg>
      );
    case "14.24": // Kebijakan publik
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      );
    case "14.25": // Kawasan terdampak konflik dan berisiko tinggi
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      );
    default: // fallback - concentric premium line bullet
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={strokeWidth}>
          <circle cx="12" cy="12" r="5" strokeDasharray="2.5 2.5" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        </svg>
      );
  }
}
*/

function BulletList({
  items,
  empty,
  variant = "neutral",
}: {
  items: { topicCode: string; title: string; text: string }[];
  empty: string;
  variant?: "strength" | "weakness" | "neutral";
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 py-4 text-center">{empty}</p>;
  }

  const badgeStyles =
    variant === "strength"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : variant === "weakness"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <ul className="space-y-6">
      {items.map((item) => (
        <li
          key={item.topicCode}
          className="border-b border-slate-100 pb-5 last:border-0 last:pb-0 transition-all duration-300 hover:translate-x-1.5"
        >
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-mono font-bold ${badgeStyles}`}>
                {item.topicCode}
              </span>
              <p className="font-extrabold text-[#0F172A] text-sm">
                {cleanTopicTitle(item.title)}
              </p>
            </div>
            <p className="text-[#475569] text-xs leading-relaxed font-medium">
              {item.text}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function InsightPanel({
  insightsByLocale,
  scores,
}: {
  insightsByLocale: Record<Locale, CompanyInsights>;
  scores?: AggregatedScores | null;
  ticker?: string;
}) {
  const { locale, L } = useLocale();
  const insights = insightsByLocale[locale];
  const isId = locale === "id";

  // Split the future recommendations string into individual sentences/action items
  const actionPoints = insights.futureInterpretation
    ? insights.futureInterpretation.split(/(?<=\.)\s+/).filter((p) => p.trim().length > 0)
    : [];

  const getPillarBadgeClass = (level: "LOW" | "MEDIUM" | "HIGH") => {
    if (level === "HIGH") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (level === "LOW") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]";
  };

  return (
    <div className="space-y-8">
      {/* KARTU 1: OVERALL ASSESSMENT (Full Width - Tipis Elegan) */}
      {scores && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition hover:shadow-md relative overflow-hidden">
          <div className="grid gap-6 md:grid-cols-12 relative z-10">
            
            {/* Performa Pilar ESG */}
            <div className="md:col-span-7 flex flex-col justify-center border-b border-slate-100 pb-5 md:border-b-0 md:border-r md:pb-0 md:pr-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-3">
                {isId ? "Performa Pilar ESG" : "ESG Pillar Performance"}
              </span>
              <div className="space-y-2.5">
                {/* Pilar E - Tree Emoji */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#475569] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a9 9 0 0 0-9 9c0 5 9 9 9 9s9-4 9-9a9 9 0 0 0-9-9Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 12v9" />
                    </svg>
                    Environmental (E)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0F172A]">{scores.pillars.E.toFixed(2)}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold border ${getPillarBadgeClass(scores.pillarLevels.E)}`}>
                      {levelLabel(scores.pillarLevels.E, locale)}
                    </span>
                  </div>
                </div>

                {/* Pilar S - Group Emoji */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#475569] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    Social (S)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0F172A]">{scores.pillars.S.toFixed(2)}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold border ${getPillarBadgeClass(scores.pillarLevels.S)}`}>
                      {levelLabel(scores.pillarLevels.S, locale)}
                    </span>
                  </div>
                </div>

                {/* Pilar G - Courthouse Emoji */}
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#475569] flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-[#64748B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M3.75 21v-8.25M20.25 21v-8.25M2.25 21h19.5M3 12.75h18L12 3 3 12.75Z" />
                    </svg>
                    Governance (G)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0F172A]">{scores.pillars.G.toFixed(2)}</span>
                    <span className={`inline-flex items-center rounded px-1.5 py-0.2 text-[10px] font-bold border ${getPillarBadgeClass(scores.pillarLevels.G)}`}>
                      {levelLabel(scores.pillarLevels.G, locale)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kepatuhan Topik GRI 14 */}
            <div className="md:col-span-5 flex flex-col justify-center md:pl-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D97706] mb-3">
                {isId ? "Kepatuhan Topik GRI 14" : "GRI 14 Topic Compliance"}
              </span>
              <div className="flex flex-col gap-2">
                <div className="text-xs font-semibold text-[#475569] flex flex-wrap gap-y-2 items-center">
                  <span className="inline-flex items-center rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.2 text-[10px] font-bold text-emerald-700">
                    {scores.distribution.score3} {isId ? "Kuat" : "High"}
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="inline-flex items-center rounded border border-[#FCD34D] bg-[#FEF3C7] px-1.5 py-0.2 text-[10px] font-bold text-[#92400E]">
                    {scores.distribution.score2} {isId ? "Sedang" : "Medium"}
                  </span>
                  <span className="mx-2 text-slate-300">•</span>
                  <span className="inline-flex items-center rounded border border-rose-200 bg-rose-50 px-1.5 py-0.2 text-[10px] font-bold text-rose-700">
                    {scores.distribution.score1} {isId ? "Lemah" : "Low"}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Strengths & Weaknesses Grid */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Strengths */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition hover:shadow-lg hover:border-emerald-200 duration-200">
          <h3 className="font-black text-emerald-700 text-md border-b border-slate-100 pb-3 mb-5">
            {L.strengths}
          </h3>
          <BulletList
            items={insights.strengths}
            empty={L.noStrengthTopics}
            variant="strength"
          />
        </div>

        {/* Weaknesses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition hover:shadow-lg hover:border-rose-200 duration-200">
          <h3 className="font-black text-rose-700 text-md border-b border-slate-100 pb-3 mb-5">
            {L.weaknesses}
          </h3>
          <BulletList
            items={insights.weaknesses}
            empty={L.noWeakTopics}
            variant="weakness"
          />
        </div>
      </div>

      {/* Action Plan (Future Interpretation) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm transition hover:shadow-lg hover:border-amber-200 duration-200">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-black text-[#0F172A] text-md flex items-center gap-3">
            <span className="flex items-center justify-center bg-slate-50 border border-slate-100 p-1.5 rounded-lg text-[#64748B] shrink-0">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8M12 3a9 9 0 019 9c0 1.94-.62 3.73-1.68 5.18a3 3 0 00-.32.6L18 20H6l-.99-2.22a3 3 0 00-.33-.6C3.62 15.73 3 13.94 3 12a9 9 0 019-9z" />
              </svg>
            </span>
            {L.actionPlanTitle}
          </h3>
        </div>

        {actionPoints.length > 0 ? (
          <ul className="space-y-2.5 mt-5">
            {actionPoints.map((point, idx) => {
              const { text } = parseActionPoint(point);
              return (
                <li
                  key={idx}
                  className="flex items-start gap-4 rounded-xl bg-[#FEF3C7]/15 p-3 border border-[#FCD34D]/35 border-l-4 border-l-[#D97706]/85 transition hover:bg-[#FEF3C7]/25 hover:shadow-sm hover:border-[#FCD34D]/60 duration-200"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FEF3C7] border border-[#FCD34D] text-[#D97706] shadow-sm mt-0.5">
                    <svg className="w-4 h-4 text-[#D97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[#475569] font-semibold leading-relaxed">
                      {text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-slate-500 mt-4 text-center py-4">
            {L.noActionPlan}
          </p>
        )}
      </div>
    </div>
  );
}

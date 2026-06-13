"use client";

import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";

export function ViewModeTabs({
  locale,
  mode,
  onChange,
}: {
  locale: Locale;
  mode: "investor" | "company";
  onChange: (m: "investor" | "company") => void;
}) {
  const L = t(locale);

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-medium w-fit">
      <button
        type="button"
        onClick={() => onChange("investor")}
        className={`px-4 py-2 ${mode === "investor" ? "bg-slate-800 text-white" : "bg-white text-slate-600"}`}
      >
        {L.investorView}
      </button>
      <button
        type="button"
        onClick={() => onChange("company")}
        className={`px-4 py-2 ${mode === "company" ? "bg-slate-800 text-white" : "bg-white text-slate-600"}`}
      >
        {L.companyView}
      </button>
    </div>
  );
}

"use client";

import { useLocale } from "@/components/providers/LocaleProvider";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocale();

  const handleToggle = (next: "id" | "en") => {
    setLocale(next);
    // #region agent log
    fetch("http://127.0.0.1:7717/ingest/412513fb-aa9c-4787-a39a-7ac497d919f0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d68e2d",
      },
      body: JSON.stringify({
        sessionId: "d68e2d",
        hypothesisId: "H3-ui-toggle",
        location: "LocaleSwitcher.tsx:handleToggle",
        message: "User clicked locale button",
        data: { from: locale, to: next },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  };

  return (
    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
      <button
        type="button"
        onClick={() => handleToggle("id")}
        className={`px-2.5 py-1 transition-colors ${
          locale === "id" ? "bg-emerald-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-pressed={locale === "id"}
      >
        ID
      </button>
      <button
        type="button"
        onClick={() => handleToggle("en")}
        className={`px-2.5 py-1 transition-colors ${
          locale === "en" ? "bg-emerald-800 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}

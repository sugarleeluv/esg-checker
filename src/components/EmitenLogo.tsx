"use client";

import Image from "next/image";
import { useState } from "react";
import { getEmitenLogoFallbacks, getEmitenLogoUrl } from "@/lib/company-logo";

export function EmitenLogo({
  ticker,
  name,
  size = 56,
}: {
  ticker: string;
  name?: string | null;
  size?: number;
}) {
  const sources = [getEmitenLogoUrl(ticker), ...getEmitenLogoFallbacks(ticker).slice(1)];
  const [srcIndex, setSrcIndex] = useState(0);
  const [failed, setFailed] = useState(false);

  const initials = ticker.slice(0, 2);
  const label = name?.split(" ").slice(0, 2).join(" ") ?? ticker;

  if (failed || srcIndex >= sources.length) {
    return (
      <div
        className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 font-bold text-white shadow-sm"
        style={{ width: size, height: size, fontSize: size * 0.32 }}
        aria-hidden
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
      style={{ width: size, height: size }}
    >
      <Image
        src={sources[srcIndex]}
        alt={`Logo ${label}`}
        width={size}
        height={size}
        className="object-contain p-1"
        onError={() => {
          if (srcIndex < sources.length - 1) {
            setSrcIndex((i) => i + 1);
          } else {
            setFailed(true);
          }
        }}
        unoptimized
      />
    </div>
  );
}

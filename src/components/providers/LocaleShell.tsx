"use client";

import { LocaleProvider, parseLocale } from "@/components/providers/LocaleProvider";
import type { Locale } from "@/lib/types";
import { useSearchParams } from "next/navigation";

export function LocaleShell({
  children,
  fallbackLocale = "id",
}: {
  children: React.ReactNode;
  fallbackLocale?: Locale;
}) {
  const searchParams = useSearchParams();
  const initialLocale = parseLocale(searchParams.get("locale") ?? fallbackLocale);

  return (
    <LocaleProvider initialLocale={initialLocale}>{children}</LocaleProvider>
  );
}

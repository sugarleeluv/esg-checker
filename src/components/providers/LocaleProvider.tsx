"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { labels, parseLocale } from "@/lib/i18n";
import type { Locale } from "@/lib/types";

export type Labels = (typeof labels)[Locale];

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => void;
  L: Labels;
  withLocale: (path: string, params?: Record<string, string>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "esg-locale";

export function LocaleProvider({
  children,
  initialLocale = "id",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLocale = params.get("locale");
    const stored = localStorage.getItem(STORAGE_KEY);

    let resolved: Locale = initialLocale;
    if (urlLocale === "id" || urlLocale === "en") {
      resolved = urlLocale;
    } else if (stored === "id" || stored === "en") {
      resolved = stored;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(resolved);
    document.documentElement.lang = resolved;
    // #region agent log
    fetch("http://127.0.0.1:7717/ingest/412513fb-aa9c-4787-a39a-7ac497d919f0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d68e2d",
      },
      body: JSON.stringify({
        sessionId: "d68e2d",
        hypothesisId: "H1-init",
        location: "LocaleProvider.tsx:mount",
        message: "Locale initialized from URL/storage",
        data: { urlLocale, stored, resolved },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, [initialLocale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;

    const url = new URL(window.location.href);
    url.searchParams.set("locale", next);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

    // #region agent log
    fetch("http://127.0.0.1:7717/ingest/412513fb-aa9c-4787-a39a-7ac497d919f0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "d68e2d",
      },
      body: JSON.stringify({
        sessionId: "d68e2d",
        hypothesisId: "H2-toggle",
        location: "LocaleProvider.tsx:setLocale",
        message: "Locale toggled without navigation",
        data: { next, href: url.toString() },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
  }, []);

  const withLocale = useCallback(
    (path: string, params?: Record<string, string>) => {
      const [pathname, existingQuery] = path.split("?");
      const search = new URLSearchParams(existingQuery ?? "");
      search.set("locale", locale);
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          search.set(key, value);
        }
      }
      const qs = search.toString();
      return qs ? `${pathname}?${qs}` : pathname;
    },
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      L: labels[locale],
      withLocale,
    }),
    [locale, setLocale, withLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}

/** Build href with locale query (safe outside provider for SSR fallbacks). */
export function hrefWithLocale(path: string, locale: Locale) {
  const [pathname, existingQuery] = path.split("?");
  const search = new URLSearchParams(existingQuery ?? "");
  search.set("locale", locale);
  const qs = search.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export { parseLocale };

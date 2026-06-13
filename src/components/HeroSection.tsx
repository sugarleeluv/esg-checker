import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { StartButton } from "./StartButton";

export function HeroSection({ locale }: { locale: Locale }) {
  const L = t(locale);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-emerald-900/10 bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 px-6 py-14 sm:px-10 sm:py-20 text-white shadow-xl">
      <div
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl"
        aria-hidden
      />

      <div className="relative max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium tracking-wide text-emerald-100">
          GRI 14 · Mining Sector · IDX
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          {L.heroTitle}
        </h1>
        <p className="mt-2 text-lg font-medium text-emerald-200/90 sm:text-xl">
          {L.heroTagline}
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-emerald-50/85 sm:text-lg">
          {L.heroDescription}
        </p>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-emerald-100/80">
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {L.heroFeature1}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {L.heroFeature2}
          </li>
          <li className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {L.heroFeature3}
          </li>
        </ul>
        <div className="mt-10">
          <StartButton label={L.heroCta} />
        </div>
      </div>
    </section>
  );
}

import type { AggregatedScores, Locale } from "@/lib/types";
import { levelLabel } from "@/lib/scoring";
import { t } from "@/lib/i18n";

function ScoreBar({ value, max = 3 }: { value: number; max?: number }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
      <div
        className="h-full rounded-full bg-emerald-600 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function levelColor(level: string) {
  if (level === "HIGH") return "text-emerald-700 bg-emerald-50";
  if (level === "LOW") return "text-red-700 bg-red-50";
  return "text-[#92400E] bg-[#FEF3C7]";
}

export function PillarScoreCard({
  scores,
  locale,
}: {
  scores: AggregatedScores;
  locale: Locale;
}) {
  const L = t(locale);
  const pillars = [
    { key: "E" as const, label: L.pillarE, value: scores.pillars.E, level: scores.pillarLevels.E },
    { key: "S" as const, label: L.pillarS, value: scores.pillars.S, level: scores.pillarLevels.S },
    { key: "G" as const, label: L.pillarG, value: scores.pillars.G, level: scores.pillarLevels.G },
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-end justify-between gap-2">
        <div>
          <p className="text-sm text-[#D97706] font-semibold">{L.overall}</p>
          <p className="text-3xl font-bold text-[#0F172A]">
            {scores.overall.toFixed(2)}
            <span className="text-lg font-normal text-[#475569]"> / 3.00</span>
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${levelColor(scores.overallLevel)}`}
        >
          {levelLabel(scores.overallLevel, locale)}
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {pillars.map((p) => (
          <div key={p.key} className="rounded-lg bg-slate-50 p-3">
            <div className="mb-1 flex justify-between text-sm">
              <span className="font-semibold text-[#0F172A]">{p.label}</span>
              <span className="text-[#475569]">{p.value.toFixed(2)}</span>
            </div>
            <ScoreBar value={p.value} />
            <p className={`mt-1 text-xs font-semibold ${levelColor(p.level).split(" ")[0]}`}>
              {levelLabel(p.level, locale)}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#475569]">
        {scores.distribution.score3} / {scores.distribution.score2} / {scores.distribution.score1}{" "}
        (3/2/1)
      </p>
    </div>
  );
}

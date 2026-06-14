"use client";

import type { AggregatedScores } from "@/lib/types";
import { levelLabel } from "@/lib/scoring";
import { useLocale } from "@/components/providers/LocaleProvider";

export function ESGPieChart({
  scores,
  size = 200,
}: {
  scores: AggregatedScores;
  size?: number;
}) {
  const { locale } = useLocale();
  const r = size / 2;
  const cx = r;
  const cy = r + (size < 150 ? 5 : 10); // offset down slightly to make room inside the arc
  const radius = r - (size < 150 ? 12 : 20); // radius of the arc
  
  // Scale weights and font sizes based on chart size
  const isCompact = size < 150;
  const strokeWidth = isCompact ? 7 : 10;
  const valueFontSize = isCompact ? 26 : 40;
  const labelFontSize = isCompact ? 8.5 : 10.5;
  const valueY = isCompact ? cy - 6 : cy - 12;
  const labelY = isCompact ? cy + 8 : cy + 12;
  const dotRadiusOuter = isCompact ? 6.5 : 9;
  const dotRadiusInner = isCompact ? 2.5 : 3.5;

  // Score value scaled out of 100 with 2 decimal places
  const scoreVal = (scores.overall * 100).toFixed(2);

  // Gauge angle starts at Math.PI (180 deg, left) and ends at 0 (0 deg, right)
  const angle = scores.overall * Math.PI;
  // Position of the indicator dot on the arc track
  const dotX = cx - radius * Math.cos(angle);
  const dotY = cy - radius * Math.sin(angle);

  const startX = cx - radius;
  const startY = cy;
  const endX = cx + radius;
  const endY = cy;

  const levelText = levelLabel(scores.overallLevel, locale);

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <linearGradient id="gauge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" /> {/* red-500 */}
            <stop offset="25%" stopColor="#f97316" /> {/* orange-500 */}
            <stop offset="50%" stopColor="#eab308" /> {/* yellow-500 */}
            <stop offset="75%" stopColor="#84cc16" /> {/* lime-500 */}
            <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
          </linearGradient>
        </defs>

        {/* Background Arc Track */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="#f1f5f9"
          strokeWidth={strokeWidth + (isCompact ? 2 : 4)}
          strokeLinecap="round"
        />

        {/* Clean Rainbow Gradient Filled Arc Track */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Indicator Dot sitting directly on the arc track */}
        {/* Outer dark border circle */}
        <circle
          cx={dotX}
          cy={dotY}
          r={dotRadiusOuter}
          fill="#1e293b"
          stroke="#ffffff"
          strokeWidth={isCompact ? "1.75" : "2.5"}
        />
        {/* Inner white dot */}
        <circle
          cx={dotX}
          cy={dotY}
          r={dotRadiusInner}
          fill="#ffffff"
        />

        {/* Large Score Value (out of 100) inside the arc */}
        <text
          x={cx}
          y={valueY}
          textAnchor="middle"
          className="fill-slate-800 font-black tracking-tight"
          fontSize={valueFontSize}
        >
          {scoreVal}
        </text>

        {/* Status label inside the arc below the number */}
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          className="fill-slate-500 font-extrabold tracking-wide uppercase"
          fontSize={labelFontSize}
        >
          {levelText}
        </text>
      </svg>
    </div>
  );
}

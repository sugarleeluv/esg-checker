import type { AggregatedScores, PillarKey, TopicScoreRow } from "./types";

export function scoreToLevel(avg: number): "LOW" | "MEDIUM" | "HIGH" {
  if (avg >= 0.833) return "HIGH";
  if (avg >= 0.5) return "MEDIUM";
  return "LOW";
}

export function levelLabel(level: "LOW" | "MEDIUM" | "HIGH", locale: "id" | "en"): string {
  const map = {
    id: { LOW: "Lemah", MEDIUM: "Sedang", HIGH: "Kuat" },
    en: { LOW: "Low", MEDIUM: "Medium", HIGH: "High" },
  };
  return map[locale][level];
}

export function aggregateScores(
  rows: { score: number; pillar: PillarKey }[]
): AggregatedScores {
  const byPillar: Record<PillarKey, number[]> = { E: [], S: [], G: [] };
  const distribution = { score1: 0, score2: 0, score3: 0 };

  for (const row of rows) {
    byPillar[row.pillar].push(row.score);
    if (row.score === 3) distribution.score3++;
    else if (row.score === 2) distribution.score2++;
    else distribution.score1++;
  }

  const pillarAvg = (key: PillarKey) => {
    const arr = byPillar[key];
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  };

  const pillars = {
    E: pillarAvg("E") / 3,
    S: pillarAvg("S") / 3,
    G: pillarAvg("G") / 3,
  };

  const allScores = rows.map((r) => r.score);
  const overall =
    allScores.length > 0
      ? (allScores.reduce((a, b) => a + b, 0) / allScores.length) / 3
      : 0;

  const pillarLevels = {
    E: scoreToLevel(pillars.E),
    S: scoreToLevel(pillars.S),
    G: scoreToLevel(pillars.G),
  };

  return {
    overall,
    overallLevel: scoreToLevel(overall),
    pillars,
    pillarLevels,
    distribution,
  };
}

export function buildTopicRows(
  scores: {
    topicCode: string;
    score: number;
    status: "LOW" | "MEDIUM" | "HIGH";
    disclosureText: string | null;
    nominalCost: string | null;
    rationaleId: string | null;
    rationaleEn: string | null;
    topic: {
      pillar: PillarKey;
      sortOrder: number;
      titleId: string;
      titleEn: string;
    };
  }[],
  locale: "id" | "en"
): TopicScoreRow[] {
  return scores
    .map((s) => ({
      topicCode: s.topicCode,
      pillar: s.topic.pillar,
      sortOrder: s.topic.sortOrder,
      title: locale === "id" ? s.topic.titleId : s.topic.titleEn,
      score: s.score,
      status: s.status,
      disclosureText: s.disclosureText,
      nominalCost: s.nominalCost,
      rationale: locale === "id" ? s.rationaleId : s.rationaleEn,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

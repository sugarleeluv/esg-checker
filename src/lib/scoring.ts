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

export function getTopicTitleTranslation(code: string, locale: "id" | "en", fallbackTitle?: string): string {
  const translations: Record<string, { id: string; en: string }> = {
    "14.1": { id: "14.1 Emisi GRK", en: "14.1 GHG emissions" },
    "14.2": { id: "14.2 Adaptasi Iklim", en: "14.2 Climate adaptation" },
    "14.3": { id: "14.3 Emisi Udara", en: "14.3 Air emissions" },
    "14.4": { id: "14.4 Keanekaragaman Hayati", en: "14.4 Biodiversity" },
    "14.5": { id: "14.5 Limbah", en: "14.5 Waste" },
    "14.6": { id: "14.6 Endapan (Tailings)", en: "14.6 Tailings" },
    "14.7": { id: "14.7 Air dan Efluen", en: "14.7 Water & effluents" },
    "14.8": { id: "14.8 Penutupan & Rehabilitasi", en: "14.8 Closure & rehabilitation" },
    "14.9": { id: "14.9 Dampak Ekonomi", en: "14.9 Economic impacts" },
    "14.10": { id: "14.10 Komunitas Lokal", en: "14.10 Local communities" },
    "14.11": { id: "14.11 Hak-Hak Masyarakat Adat", en: "14.11 Rights of Indigenous Peoples" },
    "14.12": { id: "14.12 Hak atas tanah dan sumber daya", en: "14.12 Land and resource rights" },
    "14.13": { id: "14.13 Pertambangan Rakyat", en: "14.13 Artisanal and small-scale mining" },
    "14.14": { id: "14.14 Praktik keamanan", en: "14.14 Security practices" },
    "14.15": { id: "14.15 Manajemen krisis", en: "14.15 Critical incident management" },
    "14.16": { id: "14.16 Kesehatan dan keselamatan kerja", en: "14.16 Occupational health & safety" },
    "14.17": { id: "14.17 Praktik Ketenagakerjaan", en: "14.17 Employment practices" },
    "14.18": { id: "14.18 s/d 14.20 Hak Pekerja", en: "14.18–14.20 Workers' rights" },
    "14.19": { id: "14.19 Kerja Paksa", en: "14.19 Forced labor" },
    "14.20": { id: "14.20 Kebebasan Berserikat", en: "14.20 Freedom of association" },
    "14.21": { id: "14.21 Nondiskriminasi dan peluang kesetaraan", en: "14.21 Non-discrimination and equal opportunity" },
    "14.22": { id: "14.22 Antikorupsi", en: "14.22 Anti-corruption" },
    "14.23": { id: "14.23 Pembayaran Pemerintah", en: "14.23 Payments to governments" },
    "14.24": { id: "14.24 Kebijakan publik", en: "14.24 Public policy" },
    "14.25": { id: "14.25 Kawasan terdampak konflik dan berisiko tinggi", en: "14.25 Conflict-affected and high-risk areas" }
  };

  const item = translations[code];
  if (item) {
    return locale === "id" ? item.id : item.en;
  }
  return fallbackTitle || "";
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
      title: getTopicTitleTranslation(s.topicCode, locale, locale === "id" ? s.topic.titleId : s.topic.titleEn),
      score: s.score,
      status: s.status,
      disclosureText: s.disclosureText,
      nominalCost: s.nominalCost,
      rationale: locale === "id" ? s.rationaleId : s.rationaleEn,
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

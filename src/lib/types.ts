export type Locale = "id" | "en";

export type PillarKey = "E" | "S" | "G";

export interface PillarScores {
  E: number;
  S: number;
  G: number;
}

export interface AggregatedScores {
  overall: number;
  overallLevel: "LOW" | "MEDIUM" | "HIGH";
  pillars: PillarScores;
  pillarLevels: Record<PillarKey, "LOW" | "MEDIUM" | "HIGH">;
  distribution: { score1: number; score2: number; score3: number };
}

export interface TopicScoreRow {
  topicCode: string;
  pillar: PillarKey;
  sortOrder: number;
  title: string;
  score: number;
  status: "LOW" | "MEDIUM" | "HIGH";
  disclosureText: string | null;
  nominalCost: string | null;
  rationale: string | null;
  type?: "COST" | "BENEFIT";
  titleId?: string;
  titleEn?: string;
  disclosureTextId?: string | null;
  disclosureTextEn?: string | null;
  rationaleId?: string | null;
  rationaleEn?: string | null;
}

export interface InsightBullet {
  topicCode: string;
  title: string;
  text: string;
}

export interface CompanyInsights {
  strengths: InsightBullet[];
  weaknesses: InsightBullet[];
  overallAssessment: string;
  futureInterpretation: string;
}

export interface CompanySummary {
  ticker: string;
  name: string | null;
  sector: string | null;
  subSector?: string | null;
  listingBoard?: string | null;
  scores: AggregatedScores | null;
  hasScores: boolean;
}

import { parseSheetCsv, mergeBilingualBlocks, ParsedTopicRow } from "./sheet-parser";
import { levelLabel, scoreToLevel } from "./scoring";
import { Locale, PillarKey, AggregatedScores, TopicScoreRow } from "./types";

const SHEET_ID = process.env.GOOGLE_SHEET_ID ?? "1ev1efBxnUBTbxZwgPwUgTm2MsuYXUNo5dVvaiogJS7I";

export interface CompanyCalculatedData {
  ticker: string;
  name: string;
  sector: string;
  hasScores: boolean;
  hasBenefitScores: boolean;
  scores: AggregatedScores | null;
  benefitScores: AggregatedScores | null;
  costTopics: TopicScoreRow[];
  benefitTopics: TopicScoreRow[];
  gap: number | null; // expectedBenefit - cost
  strongestCostPillar: string | null;
  weakestCostPillar: string | null;
  strongestBenefitPillar: string | null;
  weakestBenefitPillar: string | null;
}

export interface DerivedComparisonData {
  companyWithHigherCost: string | null;
  companyWithHigherBenefit: string | null;
  largestPillarDifference: {
    pillar: string;
    difference: number;
    companyA: string;
    companyB: string;
    type: "COST" | "BENEFIT";
  } | null;
  topicDifferences: Array<{
    topicCode: string;
    title: string;
    scoreA: number;
    scoreB: number;
    difference: number;
    type: "COST" | "BENEFIT";
  }>;
  numberOfDifferentTopics: number;
}

export interface ScoringServiceData {
  companies: Record<string, CompanyCalculatedData>;
  comparison: DerivedComparisonData | null;
  warnings: string[];
}

// Thread-safe Cache
interface CacheEntry {
  data: ScoringServiceData;
  timestamp: number;
}
let cachedData: CacheEntry | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Expected target totals for validation
const EXPECTED_TARGETS: Record<string, {
  COST: { E: number; S: number; G: number; overall: number };
  BENEFIT: { E: number; S: number; G: number; overall: number };
}> = {
  MDKA: {
    COST: { E: 75.00, S: 56.41, G: 66.67, overall: 64.00 },
    BENEFIT: { E: 91.67, S: 76.92, G: 83.33, overall: 82.67 },
  },
  ANTM: {
    COST: { E: 66.67, S: 61.54, G: 58.33, overall: 62.67 },
    BENEFIT: { E: 95.83, S: 71.79, G: 91.67, overall: 82.67 },
  },
};

// Baseline scores to pinpoint mismatch causes
const BASELINE_SCORES: Record<string, Record<string, { cost: number; benefit: number }>> = {
  MDKA: {
    "14.1": { cost: 2, benefit: 3 },
    "14.2": { cost: 2, benefit: 2 },
    "14.3": { cost: 2, benefit: 3 },
    "14.4": { cost: 2, benefit: 3 },
    "14.5": { cost: 2, benefit: 3 },
    "14.6": { cost: 2, benefit: 2 },
    "14.7": { cost: 3, benefit: 3 },
    "14.8": { cost: 3, benefit: 3 },
    "14.9": { cost: 3, benefit: 3 },
    "14.10": { cost: 3, benefit: 2 },
    "14.11": { cost: 1, benefit: 2 },
    "14.12": { cost: 1, benefit: 2 },
    "14.13": { cost: 2, benefit: 0 },
    "14.14": { cost: 2, benefit: 2 },
    "14.15": { cost: 2, benefit: 2 },
    "14.16": { cost: 2, benefit: 2 },
    "14.17": { cost: 3, benefit: 3 },
    "14.18": { cost: 1, benefit: 3 },
    "14.19": { cost: 1, benefit: 3 },
    "14.20": { cost: 1, benefit: 3 },
    "14.21": { cost: 2, benefit: 3 },
    "14.22": { cost: 3, benefit: 3 },
    "14.23": { cost: 3, benefit: 3 },
    "14.24": { cost: 1, benefit: 2 },
    "14.25": { cost: 1, benefit: 2 }
  },
  ANTM: {
    "14.1": { cost: 2, benefit: 3 },
    "14.2": { cost: 2, benefit: 2 },
    "14.3": { cost: 2, benefit: 3 },
    "14.4": { cost: 2, benefit: 3 },
    "14.5": { cost: 2, benefit: 3 },
    "14.6": { cost: 2, benefit: 3 },
    "14.7": { cost: 2, benefit: 3 },
    "14.8": { cost: 2, benefit: 3 },
    "14.9": { cost: 3, benefit: 3 },
    "14.10": { cost: 3, benefit: 3 },
    "14.11": { cost: 2, benefit: 2 },
    "14.12": { cost: 2, benefit: 2 },
    "14.13": { cost: 2, benefit: 2 },
    "14.14": { cost: 2, benefit: 2 },
    "14.15": { cost: 2, benefit: 2 },
    "14.16": { cost: 2, benefit: 3 },
    "14.17": { cost: 3, benefit: 3 },
    "14.18": { cost: 1, benefit: 3 },
    "14.19": { cost: 1, benefit: 3 },
    "14.20": { cost: 1, benefit: 3 },
    "14.21": { cost: 2, benefit: 3 },
    "14.22": { cost: 2, benefit: 3 },
    "14.23": { cost: 3, benefit: 3 },
    "14.24": { cost: 1, benefit: 2 },
    "14.25": { cost: 1, benefit: 3 }
  }
};

async function fetchSheetCsv(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch Google Sheets CSV: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function isCombinedWorkersRightsRow(topicCode: string, title: string): boolean {
  const t = title.toLowerCase();
  return (
    topicCode === "14.18" &&
    (t.includes("14.18-14.20") ||
      t.includes("14.18 s/d 14.20") ||
      t.includes("14.18 to 14.20") ||
      t.includes("hak pekerja") ||
      t.includes("workers' rights") ||
      t.includes("workers rights")) &&
    !t.includes("pekerja anak") &&
    !t.includes("child labor")
  );
}

function calculatePillarMetrics(
  rows: ParsedTopicRow[],
  pillar: PillarKey,
  type: "COST" | "BENEFIT"
) {
  let rawScore = 0;
  let maxScore = 0;
  let count = 0;

  const pillarRows = rows.filter((r) => r.pillar === pillar);

  for (const r of pillarRows) {
    if (r.score === null || r.score === undefined || Number.isNaN(r.score)) {
      continue;
    }
    // Determine dynamic max score: grouped row (14.18 s/d 14.20) has max score 9, otherwise 3
    let rowMax = 3;
    if (isCombinedWorkersRightsRow(r.topicCode, r.title)) {
      rowMax = 9;
    }

    rawScore += r.score;
    maxScore += rowMax;
    count++;
  }

  const percentage = maxScore > 0 ? (rawScore / maxScore) * 100 : 0.0;
  // Convert percentage out of 100 to decimal representation out of 1.0 (for compatibility with existing codebase views)
  const scoreValue = percentage / 100;

  return { rawScore, maxScore, count, scoreValue, percentage };
}

function transformTopicRows(
  idRows: ParsedTopicRow[],
  enRows: ParsedTopicRow[],
  type: "COST" | "BENEFIT"
): any[] {
  return idRows.map((idRow, idx) => {
    const enRow = enRows.find((r) => r.topicCode === idRow.topicCode) || enRows[idx];
    
    let rowMax = 3;
    if (isCombinedWorkersRightsRow(idRow.topicCode, idRow.title)) {
      rowMax = 9;
    }

    return {
      topicCode: idRow.topicCode,
      pillar: idRow.pillar as PillarKey,
      sortOrder: Math.round(parseFloat(idRow.topicCode.split(".")[1]) * 10) || 0,
      titleId: idRow.title,
      titleEn: enRow?.title || idRow.title,
      score: idRow.score,
      status: idRow.status as "LOW" | "MEDIUM" | "HIGH",
      disclosureTextId: idRow.disclosureText || null,
      disclosureTextEn: enRow?.disclosureText || idRow.disclosureText || null,
      nominalCost: idRow.nominalCost || null,
      rationaleId: idRow.rationale || null,
      rationaleEn: enRow?.rationale || idRow.rationale || null,
      type,
    };
  });
}

export async function getScoringData(forceRefresh = false): Promise<ScoringServiceData> {
  const now = Date.now();
  if (!forceRefresh && cachedData && now - cachedData.timestamp < CACHE_TTL) {
    return cachedData.data;
  }

  try {
    const [csvCost, csvBenefit] = await Promise.all([
      fetchSheetCsv("0"),
      fetchSheetCsv("810360985"),
    ]);

    const blocksCost = parseSheetCsv(csvCost, "COST");
    const blocksBenefit = parseSheetCsv(csvBenefit, "BENEFIT");

    const mergedCost = mergeBilingualBlocks(blocksCost);
    const mergedBenefit = mergeBilingualBlocks(blocksBenefit);

    const companies: Record<string, CompanyCalculatedData> = {};
    const warnings: string[] = [];

    const allTickers = new Set([
      ...Array.from(mergedCost.keys()),
      ...Array.from(mergedBenefit.keys()),
    ]);

    const tickersList = ["MDKA", "ANTM"]; // Focus on these primary companies

    for (const ticker of allTickers) {
      const tickerUpper = ticker.toUpperCase();
      if (!tickersList.includes(tickerUpper)) continue;

      const name = tickerUpper === "MDKA" ? "PT Merdeka Copper Gold Tbk" : "PT Aneka Tambang Tbk";
      const sector = "Pertambangan";

      const costBlock = mergedCost.get(tickerUpper);
      const benefitBlock = mergedBenefit.get(tickerUpper);

      const hasCost = !!costBlock && (costBlock.id.length > 0 || costBlock.en.length > 0);
      const hasBenefit = !!benefitBlock && (benefitBlock.id.length > 0 || benefitBlock.en.length > 0);

      let scores: AggregatedScores | null = null;
      let benefitScores: AggregatedScores | null = null;
      let costTopics: TopicScoreRow[] = [];
      let benefitTopics: TopicScoreRow[] = [];

      // Process Cost
      if (hasCost && costBlock) {
        const idRows = costBlock.id.length > 0 ? costBlock.id : costBlock.en;
        const enRows = costBlock.en.length > 0 ? costBlock.en : costBlock.id;

        const eMetrics = calculatePillarMetrics(idRows, "E", "COST");
        const sMetrics = calculatePillarMetrics(idRows, "S", "COST");
        const gMetrics = calculatePillarMetrics(idRows, "G", "COST");

        const totalRawScore = eMetrics.rawScore + sMetrics.rawScore + gMetrics.rawScore;
        const totalMaxScore = eMetrics.maxScore + sMetrics.maxScore + gMetrics.maxScore;
        const overallPercentage = totalMaxScore > 0 ? (totalRawScore / totalMaxScore) * 100 : 0.0;
        const overall = overallPercentage / 100;

        let score1 = 0, score2 = 0, score3 = 0;
        for (const r of idRows) {
          if (r.score === 3) score3++;
          else if (r.score === 2) score2++;
          else if (r.score === 1 || r.score === 0) score1++;
        }

        scores = {
          overall,
          overallLevel: scoreToLevel(overall),
          pillars: {
            E: eMetrics.scoreValue,
            S: sMetrics.scoreValue,
            G: gMetrics.scoreValue,
          },
          pillarLevels: {
            E: scoreToLevel(eMetrics.scoreValue),
            S: scoreToLevel(sMetrics.scoreValue),
            G: scoreToLevel(gMetrics.scoreValue),
          },
          distribution: { score1, score2, score3 },
        };

        costTopics = transformTopicRows(idRows, enRows, "COST");

        // VALIDATION FOR COST
        const target = EXPECTED_TARGETS[tickerUpper]?.COST;
        if (target) {
          const calcE = parseFloat(eMetrics.percentage.toFixed(2));
          const calcS = parseFloat(sMetrics.percentage.toFixed(2));
          const calcG = parseFloat(gMetrics.percentage.toFixed(2));
          const calcOverall = parseFloat(overallPercentage.toFixed(2));

          if (calcE !== target.E || calcS !== target.S || calcG !== target.G || calcOverall !== target.overall) {
            warnings.push(
              `Validation mismatch for ${tickerUpper} Cost. Expected: E:${target.E} S:${target.S} G:${target.G} Overall:${target.overall}. Calculated: E:${calcE} S:${calcS} G:${calcG} Overall:${calcOverall}`
            );
            // Pinpoint specific mismatching topics
            const baselines = BASELINE_SCORES[tickerUpper];
            if (baselines) {
              idRows.forEach((r) => {
                const cleanCode = r.topicCode.replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "").trim();
                const base = baselines[r.topicCode];
                if (base && r.score !== base.cost) {
                  warnings.push(
                    `-> Topic ${r.topicCode} (${cleanCode}) Cost score is ${r.score} (baseline: ${base.cost})`
                  );
                }
              });
            }
          }
        }
      }

      // Process Benefit
      if (hasBenefit && benefitBlock) {
        const idRows = benefitBlock.id.length > 0 ? benefitBlock.id : benefitBlock.en;
        const enRows = benefitBlock.en.length > 0 ? benefitBlock.en : benefitBlock.id;

        const eMetrics = calculatePillarMetrics(idRows, "E", "BENEFIT");
        const sMetrics = calculatePillarMetrics(idRows, "S", "BENEFIT");
        const gMetrics = calculatePillarMetrics(idRows, "G", "BENEFIT");

        const totalRawScore = eMetrics.rawScore + sMetrics.rawScore + gMetrics.rawScore;
        const totalMaxScore = eMetrics.maxScore + sMetrics.maxScore + gMetrics.maxScore;
        const overallPercentage = totalMaxScore > 0 ? (totalRawScore / totalMaxScore) * 100 : 0.0;
        const overall = overallPercentage / 100;

        let score1 = 0, score2 = 0, score3 = 0;
        for (const r of idRows) {
          if (r.score === 3) score3++;
          else if (r.score === 2) score2++;
          else if (r.score === 1 || r.score === 0) score1++;
        }

        benefitScores = {
          overall,
          overallLevel: scoreToLevel(overall),
          pillars: {
            E: eMetrics.scoreValue,
            S: sMetrics.scoreValue,
            G: gMetrics.scoreValue,
          },
          pillarLevels: {
            E: scoreToLevel(eMetrics.scoreValue),
            S: scoreToLevel(sMetrics.scoreValue),
            G: scoreToLevel(gMetrics.scoreValue),
          },
          distribution: { score1, score2, score3 },
        };

        benefitTopics = transformTopicRows(idRows, enRows, "BENEFIT");

        // VALIDATION FOR BENEFIT
        const target = EXPECTED_TARGETS[tickerUpper]?.BENEFIT;
        if (target) {
          const calcE = parseFloat(eMetrics.percentage.toFixed(2));
          const calcS = parseFloat(sMetrics.percentage.toFixed(2));
          const calcG = parseFloat(gMetrics.percentage.toFixed(2));
          const calcOverall = parseFloat(overallPercentage.toFixed(2));

          if (calcE !== target.E || calcS !== target.S || calcG !== target.G || calcOverall !== target.overall) {
            warnings.push(
              `Validation mismatch for ${tickerUpper} Expected Benefit. Expected: E:${target.E} S:${target.S} G:${target.G} Overall:${target.overall}. Calculated: E:${calcE} S:${calcS} G:${calcG} Overall:${calcOverall}`
            );
            const baselines = BASELINE_SCORES[tickerUpper];
            if (baselines) {
              idRows.forEach((r) => {
                const cleanCode = r.topicCode.replace(/^14\.\d+\s*(?:s\/d|t\/o|–|-)?\s*(?:14\.\d+)?\s*/i, "").trim();
                const base = baselines[r.topicCode];
                if (base && r.score !== base.benefit) {
                  warnings.push(
                    `-> Topic ${r.topicCode} (${cleanCode}) Benefit score is ${r.score} (baseline: ${base.benefit})`
                  );
                }
              });
            }
          }
        }
      }

      // Calculations for gaps & strongest/weakest pillars
      let gap: number | null = null;
      if (scores && benefitScores) {
        gap = parseFloat(((benefitScores.overall - scores.overall) * 100).toFixed(2));
      }

      const getPillarPerformance = (agg: AggregatedScores | null) => {
        if (!agg) return { strongest: null, weakest: null };
        const p = agg.pillars;
        const list = [
          { name: "Environmental", value: p.E },
          { name: "Social", value: p.S },
          { name: "Governance", value: p.G },
        ];
        list.sort((a, b) => a.value - b.value);
        return {
          strongest: list[list.length - 1].name,
          weakest: list[0].name,
        };
      };

      const costPerformance = getPillarPerformance(scores);
      const benefitPerformance = getPillarPerformance(benefitScores);

      companies[tickerUpper] = {
        ticker: tickerUpper,
        name,
        sector,
        hasScores: hasCost,
        hasBenefitScores: hasBenefit,
        scores,
        benefitScores,
        costTopics,
        benefitTopics,
        gap,
        strongestCostPillar: costPerformance.strongest,
        weakestCostPillar: costPerformance.weakest,
        strongestBenefitPillar: benefitPerformance.strongest,
        weakestBenefitPillar: benefitPerformance.weakest,
      };
    }

    // Generate comparison data dynamically between MDKA and ANTM
    let comparison: DerivedComparisonData | null = null;
    const mdka = companies["MDKA"];
    const antm = companies["ANTM"];

    if (mdka && antm) {
      let companyWithHigherCost = null;
      if (mdka.scores && antm.scores) {
        companyWithHigherCost = mdka.scores.overall > antm.scores.overall ? "MDKA" : "ANTM";
      }

      let companyWithHigherBenefit = null;
      if (mdka.benefitScores && antm.benefitScores) {
        companyWithHigherBenefit = mdka.benefitScores.overall > antm.benefitScores.overall ? "MDKA" : "ANTM";
      }

      // Determine largest pillar difference
      let largestPillarDiff = -1;
      let largestPillarDiffName = "";
      let largestPillarDiffCompanyA = "";
      let largestPillarDiffCompanyB = "";
      let largestPillarDiffType: "COST" | "BENEFIT" = "COST";

      const pillars: PillarKey[] = ["E", "S", "G"];
      for (const p of pillars) {
        if (mdka.scores && antm.scores) {
          const diff = Math.abs(mdka.scores.pillars[p] - antm.scores.pillars[p]) * 100;
          if (diff > largestPillarDiff) {
            largestPillarDiff = diff;
            largestPillarDiffName = p === "E" ? "Environmental" : p === "S" ? "Social" : "Governance";
            largestPillarDiffCompanyA = "MDKA";
            largestPillarDiffCompanyB = "ANTM";
            largestPillarDiffType = "COST";
          }
        }
        if (mdka.benefitScores && antm.benefitScores) {
          const diff = Math.abs(mdka.benefitScores.pillars[p] - antm.benefitScores.pillars[p]) * 100;
          if (diff > largestPillarDiff) {
            largestPillarDiff = diff;
            largestPillarDiffName = p === "E" ? "Environmental" : p === "S" ? "Social" : "Governance";
            largestPillarDiffCompanyA = "MDKA";
            largestPillarDiffCompanyB = "ANTM";
            largestPillarDiffType = "BENEFIT";
          }
        }
      }

      const largestPillarDifference = largestPillarDiff >= 0 ? {
        pillar: largestPillarDiffName,
        difference: parseFloat(largestPillarDiff.toFixed(2)),
        companyA: largestPillarDiffCompanyA,
        companyB: largestPillarDiffCompanyB,
        type: largestPillarDiffType,
      } : null;

      // Topic differences
      const topicDifferences: DerivedComparisonData["topicDifferences"] = [];
      let diffCount = 0;

      // Combine all cost/benefit topics to find differences
      mdka.costTopics.forEach((tA) => {
        const tB = antm.costTopics.find((t) => t.topicCode === tA.topicCode);
        if (tB && tA.score !== tB.score) {
          diffCount++;
          topicDifferences.push({
            topicCode: tA.topicCode,
            title: tA.title,
            scoreA: tA.score,
            scoreB: tB.score,
            difference: Math.abs(tA.score - tB.score),
            type: "COST",
          });
        }
      });

      mdka.benefitTopics.forEach((tA) => {
        const tB = antm.benefitTopics.find((t) => t.topicCode === tA.topicCode);
        if (tB && tA.score !== tB.score) {
          diffCount++;
          topicDifferences.push({
            topicCode: tA.topicCode,
            title: tA.title,
            scoreA: tA.score,
            scoreB: tB.score,
            difference: Math.abs(tA.score - tB.score),
            type: "BENEFIT",
          });
        }
      });

      comparison = {
        companyWithHigherCost,
        companyWithHigherBenefit,
        largestPillarDifference,
        topicDifferences: topicDifferences.sort((a, b) => b.difference - a.difference),
        numberOfDifferentTopics: diffCount,
      };
    }

    if (warnings.length > 0) {
      console.warn("=== ESG CHECKER CALCULATOR WARNINGS ===");
      warnings.forEach((w) => console.warn(w));
    }

    const serviceData: ScoringServiceData = {
      companies,
      comparison,
      warnings,
    };

    cachedData = {
      data: serviceData,
      timestamp: now,
    };

    return serviceData;
  } catch (error) {
    console.error("Failed to load or calculate scores from Google Sheets:", error);
    // If we have an expired cache, we can fallback to it in extreme cases but should throw to honor the no-old-mock-score requirement
    throw error;
  }
}

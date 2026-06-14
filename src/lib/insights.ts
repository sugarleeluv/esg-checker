import type {
  AggregatedScores,
  CompanyInsights,
  InsightBullet,
  Locale,
  PillarKey,
  TopicScoreRow,
} from "./types";
import { levelLabel } from "./scoring";

const FUTURE_TEMPLATES_ID: Record<string, string> = {
  "14.11": "Perkuat program dan pengungkapan biaya khusus terkait hak masyarakat adat (GRI 14.11).",
  "14.12": "Dokumentasikan mekanisme dan alokasi dana untuk hak atas tanah dan sumber daya (GRI 14.12).",
  "14.13": "Kembangkan program pertambangan rakyat/skala kecil dengan alokasi anggaran terukur (GRI 14.13).",
  "14.24": "Ungkap kontribusi kebijakan publik secara lebih transparan jika material (GRI 14.24).",
  "14.25": "Perjelas program dan biaya untuk kawasan konflik/berisiko tinggi (GRI 14.25).",
  E_weak:
    "Pisahkan biaya lingkungan per topik GRI 14.1–14.8 agar investor dapat menilai investasi mitigasi secara granular.",
  many_medium:
    "Banyak topik berada pada level Sedang, tingkatkan kuantifikasi biaya per disclosure untuk naik ke level Kuat.",
};

const FUTURE_TEMPLATES_EN: Record<string, string> = {
  "14.11": "Strengthen programs and cost disclosure for indigenous peoples' rights (GRI 14.11).",
  "14.12": "Document land and resource rights mechanisms with dedicated funding (GRI 14.12).",
  "14.13": "Develop ASM/small-scale mining programs with measurable budgets (GRI 14.13).",
  "14.24": "Improve transparency on public policy contributions where material (GRI 14.24).",
  "14.25": "Clarify programs and costs for conflict-affected/high-risk areas (GRI 14.25).",
  E_weak:
    "Disaggregate environmental costs per GRI 14.1–14.8 topic for investor-grade granularity.",
  many_medium:
    "Many topics are Medium, improve cost quantification per disclosure to reach High level.",
};

function pickBullets(
  rows: TopicScoreRow[],
  score: number,
  limit: number
): InsightBullet[] {
  return rows
    .filter((r) => score === 1 ? (r.score === 1 || r.score === 0) : r.score === score)
    .sort((a, b) => (b.rationale?.length ?? 0) - (a.rationale?.length ?? 0))
    .slice(0, limit)
    .map((r) => ({
      topicCode: r.topicCode,
      title: r.title,
      text: r.rationale || r.disclosureText || "",
    }));
}

export function generateInsights(
  ticker: string,
  costRows: TopicScoreRow[],
  benefitRows: TopicScoreRow[],
  costScores: AggregatedScores,
  benefitScores: AggregatedScores | null,
  locale: Locale,
  peerScores?: { ticker: string; overall: number }[]
): CompanyInsights {
  const strengths = pickBullets(costRows, 3, 5);
  const weaknesses = pickBullets(costRows, 1, 5);

  const templates = locale === "id" ? FUTURE_TEMPLATES_ID : FUTURE_TEMPLATES_EN;
  
  const costPct = (costScores.overall * 100).toFixed(2);
  const benefitPct = benefitScores ? (benefitScores.overall * 100).toFixed(2) : "0.00";
  const gapVal = benefitScores ? Math.abs(benefitScores.overall - costScores.overall) * 100 : 0.0;
  const gapPct = gapVal.toFixed(2);

  // Find strongest and weakest pillars from Cost scores
  const pValues = [
    { name: "Environmental (E)", val: costScores.pillars.E, labelId: "Lingkungan (E)", labelEn: "Environmental (E)" },
    { name: "Social (S)", val: costScores.pillars.S, labelId: "Sosial (S)", labelEn: "Social (S)" },
    { name: "Governance (G)", val: costScores.pillars.G, labelId: "Tata Kelola (G)", labelEn: "Governance (G)" },
  ];
  pValues.sort((a, b) => a.val - b.val);
  const weakestPillar = locale === "id" ? pValues[0].labelId : pValues[0].labelEn;
  const strongestPillar = locale === "id" ? pValues[pValues.length - 1].labelId : pValues[pValues.length - 1].labelEn;

  let overallAssessment = "";
  if (locale === "id") {
    overallAssessment = `${ticker} memperoleh Skor Cost ESG sebesar ${costPct}% (${levelLabel(costScores.overallLevel, locale)}) dan Skor Expected Benefit ESG sebesar ${benefitPct}% (${benefitScores ? levelLabel(benefitScores.overallLevel, locale) : "Lemah"}). Kesenjangan (disclosure gap) tercatat sebesar ${gapPct} poin. Wajib dipahami bahwa kesenjangan ini merepresentasikan perbedaan dalam tingkat kelengkapan pengungkapan dan keterukuran dampak nyata dari inisiatif keberlanjutan, bukan merupakan ukuran keuntungan finansial/profitabilitas. Pilar terkuat perusahaan saat ini adalah ${strongestPillar}, sedangkan pilar terlemah yang perlu diprioritaskan untuk perbaikan adalah ${weakestPillar}.`;
  } else {
    overallAssessment = `${ticker} achieves an ESG Cost Score of ${costPct}% (${levelLabel(costScores.overallLevel, locale)}) and an ESG Expected Benefit Score of ${benefitPct}% (${benefitScores ? levelLabel(benefitScores.overallLevel, locale) : "Low"}), resulting in a disclosure gap of ${gapPct} points. It is crucial to note that this gap represents differences in disclosure completeness and impact measurability of sustainability commitments, rather than financial profit. The company's strongest performance is in the ${strongestPillar} pillar, while the ${weakestPillar} pillar is the weakest and should be prioritized for improvement.`;
  }

  if (peerScores && peerScores.length > 0) {
    const peers = peerScores.filter((p) => p.ticker !== ticker);
    if (peers.length > 0) {
      const avgPeer = (peers.reduce((a, p) => a + p.overall, 0) / peers.length) * 100;
      const delta = (costScores.overall * 100) - avgPeer;
      if (locale === "id") {
        overallAssessment += ` Dibandingkan dengan rata-rata peer industri (${avgPeer.toFixed(2)}%), Skor Cost perusahaan berada ${delta >= 0 ? "di atas" : "di bawah"} rata-rata dengan selisih ${Math.abs(delta).toFixed(2)} poin.`;
      } else {
        overallAssessment += ` Compared to the industry peer average (${avgPeer.toFixed(2)}%), the company's Cost Score is ${delta >= 0 ? "above" : "below"} average by a margin of ${Math.abs(delta).toFixed(2)} points.`;
      }
    }
  }

  const future: string[] = [];
  for (const w of weaknesses) {
    if (templates[w.topicCode]) future.push(templates[w.topicCode]);
  }
  if (costScores.pillars.E < 0.73 && costScores.pillarLevels.E !== "HIGH") {
    future.push(templates.E_weak);
  }
  if (costScores.distribution.score2 >= 10) {
    future.push(templates.many_medium);
  }
  if (future.length === 0) {
    future.push(
      locale === "id"
        ? "Pertahankan disclosure kuantitatif pada topik skor 3 dan tingkatkan pemisahan biaya pada topik Sedang."
        : "Maintain quantitative disclosure on score-3 topics and improve cost separation on Medium topics."
    );
  }

  return {
    strengths,
    weaknesses,
    overallAssessment,
    futureInterpretation: [...new Set(future)].slice(0, 5).join(" "),
  };
}

export function dominantWeakPillar(rows: TopicScoreRow[]): PillarKey | null {
  const counts: Record<PillarKey, number> = { E: 0, S: 0, G: 0 };
  for (const r of rows.filter((x) => x.score === 1 || x.score === 0)) {
    counts[r.pillar]++;
  }
  const max = Math.max(counts.E, counts.S, counts.G);
  if (max === 0) return null;
  return (Object.keys(counts) as PillarKey[]).find((k) => counts[k] === max) ?? null;
}

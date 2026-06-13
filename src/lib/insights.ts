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
  rows: TopicScoreRow[],
  scores: AggregatedScores,
  locale: Locale,
  peerScores?: { ticker: string; overall: number }[]
): CompanyInsights {
  const strengths = pickBullets(rows, 3, 5);
  const weaknesses = pickBullets(rows, 1, 5);

  const templates = locale === "id" ? FUTURE_TEMPLATES_ID : FUTURE_TEMPLATES_EN;
  const oaParts: string[] = [];

  if (locale === "id") {
    oaParts.push(
      `${ticker} memperoleh skor keseluruhan ${scores.overall.toFixed(2)}/1.00 (${levelLabel(scores.overallLevel, locale)}).`
    );
    oaParts.push(
      `Pilar Lingkungan (E): ${scores.pillars.E.toFixed(2)} (${levelLabel(scores.pillarLevels.E, locale)}), ` +
        `Sosial (S): ${scores.pillars.S.toFixed(2)} (${levelLabel(scores.pillarLevels.S, locale)}), ` +
        `Tata Kelola (G): ${scores.pillars.G.toFixed(2)} (${levelLabel(scores.pillarLevels.G, locale)}).`
    );
    oaParts.push(
      `Distribusi: ${scores.distribution.score3} topik Kuat, ${scores.distribution.score2} Sedang, ${scores.distribution.score1} Lemah dari ${rows.length} topik GRI 14.`
    );
  } else {
    oaParts.push(
      `${ticker} achieves an overall score of ${scores.overall.toFixed(2)}/1.00 (${levelLabel(scores.overallLevel, locale)}).`
    );
    oaParts.push(
      `Environmental (E): ${scores.pillars.E.toFixed(2)} (${levelLabel(scores.pillarLevels.E, locale)}), ` +
        `Social (S): ${scores.pillars.S.toFixed(2)} (${levelLabel(scores.pillarLevels.S, locale)}), ` +
        `Governance (G): ${scores.pillars.G.toFixed(2)} (${levelLabel(scores.pillarLevels.G, locale)}).`
    );
    oaParts.push(
      `Distribution: ${scores.distribution.score3} High, ${scores.distribution.score2} Medium, ${scores.distribution.score1} Low of ${rows.length} GRI 14 topics.`
    );
  }

  if (peerScores && peerScores.length > 0) {
    const peers = peerScores.filter((p) => p.ticker !== ticker);
    if (peers.length > 0) {
      const avgPeer =
        peers.reduce((a, p) => a + p.overall, 0) / peers.length;
      const delta = scores.overall - avgPeer;
      if (locale === "id") {
        oaParts.push(
          delta >= 0
            ? `Skor ${delta >= 0.1 ? "di atas" : "selaras dengan"} rata-rata peer (${avgPeer.toFixed(2)}).`
            : `Skor ${Math.abs(delta).toFixed(2)} poin di bawah rata-rata peer (${avgPeer.toFixed(2)}).`
        );
      } else {
        oaParts.push(
          delta >= 0
            ? `Score is ${delta >= 0.1 ? "above" : "in line with"} peer average (${avgPeer.toFixed(2)}).`
            : `Score is ${Math.abs(delta).toFixed(2)} points below peer average (${avgPeer.toFixed(2)}).`
        );
      }
    }
  }

  const future: string[] = [];
  for (const w of weaknesses) {
    if (templates[w.topicCode]) future.push(templates[w.topicCode]);
  }
  if (scores.pillars.E < 2.2 && scores.pillarLevels.E !== "HIGH") {
    future.push(templates.E_weak);
  }
  if (scores.distribution.score2 >= 10) {
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
    overallAssessment: oaParts.join(" "),
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

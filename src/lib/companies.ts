import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";
import { getEmitenByTicker } from "./emiten-directory";
import { generateInsights } from "./insights";
import { aggregateScores, buildTopicRows } from "./scoring";
import type {
  AggregatedScores,
  CompanyInsights,
  CompanySummary,
  Locale,
  TopicScoreRow,
} from "./types";

function toSummary(
  c: {
    ticker: string;
    name: string | null;
    sector: string | null;
    topicScores: { score: number; topic: { pillar: string }; type?: string }[];
    profile: { name: string | null; sector: string | null; subSector: string | null; listingBoard: string | null } | null;
  }
): CompanySummary {
  const rows = c.topicScores
    .filter((s) => !s.type || s.type === "COST")
    .map((s) => ({
      score: s.score,
      pillar: s.topic.pillar as "E" | "S" | "G",
    }));
  const hasScores = rows.length > 0;
  return {
    ticker: c.ticker,
    name: c.profile?.name ?? c.name,
    sector: c.profile?.sector ?? c.sector,
    subSector: c.profile?.subSector,
    listingBoard: c.profile?.listingBoard,
    scores: hasScores ? aggregateScores(rows) : null,
    hasScores,
  };
}

export async function listCompanies(): Promise<CompanySummary[]> {
  const companies = await prisma.company.findMany({
    include: {
      topicScores: { include: { topic: true } },
      profile: true,
    },
    orderBy: { ticker: "asc" },
  });
  return companies.map(toSummary);
}

const EMPTY_INSIGHTS_ID: CompanyInsights = {
  strengths: [],
  weaknesses: [],
  overallAssessment: "Data penilaian ESG GRI 14 belum tersedia untuk emiten ini.",
  futureInterpretation: "Penilaian akan ditampilkan setelah data disclosure diimpor dari Google Sheet.",
};

const EMPTY_INSIGHTS_EN: CompanyInsights = {
  strengths: [],
  weaknesses: [],
  overallAssessment: "GRI 14 ESG assessment data is not yet available for this issuer.",
  futureInterpretation: "Scores will appear after disclosure data is imported from the Google Sheet.",
};

export async function getCompanyDetail(ticker: string, locale: Locale = "id") {
  const upper = ticker.toUpperCase();
  let company = await prisma.company.findUnique({
    where: { ticker: upper },
    include: {
      topicScores: { include: { topic: true } },
      profile: true,
      insights: { where: { locale } },
    },
  });

  if (!company) {
    const meta = getEmitenByTicker(upper);
    if (!meta) return null;
    company = await prisma.company.create({
      data: {
        ticker: upper,
        name: meta.name,
        sector: meta.sector,
      },
      include: {
        topicScores: { include: { topic: true } },
        profile: true,
        insights: { where: { locale } },
      },
    });
  }

  const costScores = company.topicScores.filter((s) => !s.type || s.type === "COST");
  const benefitScores = company.topicScores.filter((s) => s.type === "BENEFIT");

  const hasScores = costScores.length > 0;
  const costTopicRows: TopicScoreRow[] = hasScores
    ? buildTopicRows(costScores, locale)
    : [];

  const benefitTopicRows: TopicScoreRow[] = benefitScores.length > 0
    ? buildTopicRows(benefitScores, locale)
    : [];

  let scores: AggregatedScores | null = null;
  if (hasScores) {
    scores = aggregateScores(
      costScores.map((s) => ({
        score: s.score,
        pillar: s.topic.pillar as "E" | "S" | "G",
      }))
    );
  }

  let benefitScoresAggregated: AggregatedScores | null = null;
  const hasBenefitScores = benefitScores.length > 0;
  if (hasBenefitScores) {
    benefitScoresAggregated = aggregateScores(
      benefitScores.map((s) => ({
        score: s.score,
        pillar: s.topic.pillar as "E" | "S" | "G",
      }))
    );
  }

  let insights: CompanyInsights;
  const stored = company.insights[0];
  if (stored) {
    insights = {
      strengths: stored.strengths as unknown as CompanyInsights["strengths"],
      weaknesses: stored.weaknesses as unknown as CompanyInsights["weaknesses"],
      overallAssessment: stored.overallAssessment,
      futureInterpretation: stored.futureInterpretation,
    };
  } else if (hasScores && scores) {
    const all = await listCompanies();
    const peerScores = all
      .filter((c) => c.hasScores && c.scores)
      .map((c) => ({ ticker: c.ticker, overall: c.scores!.overall }));
    insights = generateInsights(
      company.ticker,
      costTopicRows,
      scores,
      locale,
      peerScores
    );
  } else {
    insights = locale === "id" ? EMPTY_INSIGHTS_ID : EMPTY_INSIGHTS_EN;
  }

  return {
    ticker: company.ticker,
    name: company.profile?.name ?? company.name,
    sector: company.profile?.sector ?? company.sector,
    profile: company.profile,
    scores,
    benefitScores: benefitScoresAggregated,
    hasScores,
    hasBenefitScores,
    topics: costTopicRows,
    costTopics: costTopicRows,
    benefitTopics: benefitTopicRows,
    insights,
  };
}

export async function compareCompanies(tickers: string[], locale: Locale = "id") {
  const normalized = tickers.map((t) => t.toUpperCase());
  const companies = await prisma.company.findMany({
    where: { ticker: { in: normalized } },
    include: {
      topicScores: { include: { topic: true } },
      profile: true,
    },
  });

  const allTopics = await prisma.griTopic.findMany({ orderBy: { sortOrder: "asc" } });

  const matrix = allTopics.map((topic) => {
    const cells: Record<string, { score: number; status: string } | null> = {};
    for (const c of companies) {
      const ts = c.topicScores.find((s) => s.topicCode === topic.code && (!s.type || s.type === "COST"));
      cells[c.ticker] = ts ? { score: ts.score, status: ts.status } : null;
    }
    const scores = Object.values(cells)
      .filter(Boolean)
      .map((c) => c!.score);
    const maxDelta =
      scores.length >= 2 ? Math.max(...scores) - Math.min(...scores) : 0;

    return {
      topicCode: topic.code,
      pillar: topic.pillar,
      title: locale === "id" ? topic.titleId : topic.titleEn,
      cells,
      highlight: maxDelta >= 2,
    };
  });

  const summaries = companies.map((c) => {
    const summary = toSummary(c);
    return {
      ticker: summary.ticker,
      name: summary.name,
      scores: summary.scores,
      hasScores: summary.hasScores,
    };
  });

  return { companies: summaries, matrix };
}

export async function refreshAllInsights(locale: Locale = "id") {
  const companies = await prisma.company.findMany({
    include: { topicScores: { include: { topic: true } } },
  });
  const summaries = companies
    .filter((c) => c.topicScores.length > 0)
    .map((c) => {
      const costScores = c.topicScores.filter((s) => !s.type || s.type === "COST");
      return {
        ticker: c.ticker,
        overall: aggregateScores(
          costScores.map((s) => ({
            score: s.score,
            pillar: s.topic.pillar as "E" | "S" | "G",
          }))
        ).overall,
      };
    });

  for (const c of companies) {
    const costScores = c.topicScores.filter((s) => !s.type || s.type === "COST");
    if (costScores.length === 0) continue;
    const topicRows = buildTopicRows(costScores, locale);
    const scores = aggregateScores(
      costScores.map((s) => ({
        score: s.score,
        pillar: s.topic.pillar as "E" | "S" | "G",
      }))
    );
    const insights = generateInsights(
      c.ticker,
      topicRows,
      scores,
      locale,
      summaries
    );

    await prisma.companyInsight.upsert({
      where: {
        companyTicker_locale: { companyTicker: c.ticker, locale },
      },
      create: {
        companyTicker: c.ticker,
        locale,
        strengths: insights.strengths as unknown as Prisma.InputJsonValue,
        weaknesses: insights.weaknesses as unknown as Prisma.InputJsonValue,
        overallAssessment: insights.overallAssessment,
        futureInterpretation: insights.futureInterpretation,
      },
      update: {
        strengths: insights.strengths as unknown as Prisma.InputJsonValue,
        weaknesses: insights.weaknesses as unknown as Prisma.InputJsonValue,
        overallAssessment: insights.overallAssessment,
        futureInterpretation: insights.futureInterpretation,
        generatedAt: new Date(),
        version: { increment: 1 },
      },
    });
  }
}

export async function getAllCompaniesForComparison() {
  const rawCompanies = await prisma.company.findMany({
    include: {
      topicScores: {
        include: {
          topic: true
        }
      },
      profile: true,
    },
    orderBy: { ticker: "asc" },
  });

  const allTopics = await prisma.griTopic.findMany({ orderBy: { sortOrder: "asc" } });

  const companies = rawCompanies.map((c) => {
    const summary = toSummary(c);
    return {
      ticker: c.ticker,
      name: summary.name,
      sector: summary.sector,
      scores: summary.scores,
      hasScores: summary.hasScores,
      profile: c.profile,
      topicScores: c.topicScores.map((ts) => ({
        score: ts.score,
        status: ts.status,
        topicCode: ts.topicCode,
        type: ts.type,
        topic: {
          pillar: ts.topic.pillar,
        },
      })),
    };
  });

  return { companies, allTopics };
}


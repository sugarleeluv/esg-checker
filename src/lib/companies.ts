import { prisma } from "./prisma";
import { getEmitenByTicker } from "./emiten-directory";
import { generateInsights } from "./insights";
import { getScoringData } from "./scoringService";
import { getTopicTitleTranslation } from "./scoring";
import type {
  AggregatedScores,
  CompanyInsights,
  CompanySummary,
  Locale,
  TopicScoreRow,
} from "./types";

function localizeTopics(topics: any[], locale: Locale): TopicScoreRow[] {
  return topics.map((t) => ({
    topicCode: t.topicCode,
    pillar: t.pillar,
    sortOrder: t.sortOrder,
    title: getTopicTitleTranslation(t.topicCode, locale, locale === "id" ? t.titleId : t.titleEn),
    score: t.score,
    status: t.status,
    disclosureText: locale === "id" ? t.disclosureTextId : t.disclosureTextEn,
    nominalCost: t.nominalCost,
    rationale: locale === "id" ? t.rationaleId : t.rationaleEn,
    type: t.type,
  }));
}

export async function listCompanies(): Promise<CompanySummary[]> {
  const [serviceData, dbCompanies] = await Promise.all([
    getScoringData(),
    prisma.company.findMany({
      include: { profile: true },
      orderBy: { ticker: "asc" },
    }),
  ]);

  return dbCompanies.map((c) => {
    const tickerUpper = c.ticker.toUpperCase();
    const calc = serviceData.companies[tickerUpper];
    return {
      ticker: c.ticker,
      name: c.profile?.name ?? c.name,
      sector: c.profile?.sector ?? c.sector,
      subSector: c.profile?.subSector,
      listingBoard: c.profile?.listingBoard,
      scores: calc?.scores ?? null,
      hasScores: !!calc?.scores,
    };
  });
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
  const [serviceData, dbCompany] = await Promise.all([
    getScoringData(),
    prisma.company.findUnique({
      where: { ticker: upper },
      include: { profile: true },
    }),
  ]);

  let company = dbCompany;
  if (!company) {
    const meta = getEmitenByTicker(upper);
    if (!meta) return null;
    company = await prisma.company.create({
      data: {
        ticker: upper,
        name: meta.name,
        sector: meta.sector,
      },
      include: { profile: true },
    });
  }

  const calc = serviceData.companies[upper];
  const hasScores = !!calc?.scores;
  const hasBenefitScores = !!calc?.benefitScores;

  const costTopicRows = calc ? localizeTopics(calc.costTopics, locale) : [];
  const benefitTopicRows = calc ? localizeTopics(calc.benefitTopics, locale) : [];

  let insights: CompanyInsights;
  if (calc && calc.scores) {
    const all = await listCompanies();
    const peerScores = all
      .filter((c) => c.hasScores && c.scores)
      .map((c) => ({ ticker: c.ticker, overall: c.scores!.overall }));

    insights = generateInsights(
      upper,
      costTopicRows,
      benefitTopicRows,
      calc.scores,
      calc.benefitScores,
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
    scores: calc?.scores ?? null,
    benefitScores: calc?.benefitScores ?? null,
    hasScores,
    hasBenefitScores,
    topics: costTopicRows,
    costTopics: costTopicRows,
    benefitTopics: benefitTopicRows,
    insights,
  };
}

export async function compareCompanies(tickers: string[], locale: Locale = "id") {
  const serviceData = await getScoringData();
  const normalized = tickers.map((t) => t.toUpperCase());

  const companies = await prisma.company.findMany({
    where: { ticker: { in: normalized } },
    include: { profile: true },
  });

  const allTopics = await prisma.griTopic.findMany({ orderBy: { sortOrder: "asc" } });

  const matrix = allTopics.map((topic) => {
    const cells: Record<string, { score: number; status: string } | null> = {};
    for (const c of companies) {
      const calc = serviceData.companies[c.ticker.toUpperCase()];
      if (calc) {
        const ts = calc.costTopics.find((t) => t.topicCode === topic.code);
        cells[c.ticker] = ts ? { score: ts.score, status: ts.status } : null;
      } else {
        cells[c.ticker] = null;
      }
    }
    const scores = Object.values(cells)
      .filter(Boolean)
      .map((c) => c!.score);
    const maxDelta =
      scores.length >= 2 ? Math.max(...scores) - Math.min(...scores) : 0;

    return {
      topicCode: topic.code,
      pillar: topic.pillar,
      title: getTopicTitleTranslation(topic.code, locale, locale === "id" ? topic.titleId : topic.titleEn),
      cells,
      highlight: maxDelta >= 2,
    };
  });

  const summaries = companies.map((c) => {
    const calc = serviceData.companies[c.ticker.toUpperCase()];
    return {
      ticker: c.ticker,
      name: c.profile?.name ?? c.name,
      scores: calc?.scores ?? null,
      hasScores: !!calc?.scores,
    };
  });

  return { companies: summaries, matrix };
}

export async function refreshAllInsights(locale: Locale = "id") {
  // Dynamic calculation forces refresh of the sheets data cache
  await getScoringData(true);
}

export async function getAllCompaniesForComparison() {
  const [serviceData, dbCompanies, allTopics] = await Promise.all([
    getScoringData(),
    prisma.company.findMany({
      include: { profile: true },
      orderBy: { ticker: "asc" },
    }),
    prisma.griTopic.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const companies = dbCompanies.map((c) => {
    const tickerUpper = c.ticker.toUpperCase();
    const calc = serviceData.companies[tickerUpper];
    
    const topicScores: any[] = [];
    if (calc) {
      calc.costTopics.forEach((t) => {
        topicScores.push({
          score: t.score,
          status: t.status,
          topicCode: t.topicCode,
          type: "COST",
          topic: { pillar: t.pillar },
          disclosureTextId: t.disclosureTextId,
          disclosureTextEn: t.disclosureTextEn,
          rationaleId: t.rationaleId,
          rationaleEn: t.rationaleEn,
        });
      });
      calc.benefitTopics.forEach((t) => {
        topicScores.push({
          score: t.score,
          status: t.status,
          topicCode: t.topicCode,
          type: "BENEFIT",
          topic: { pillar: t.pillar },
          disclosureTextId: t.disclosureTextId,
          disclosureTextEn: t.disclosureTextEn,
          rationaleId: t.rationaleId,
          rationaleEn: t.rationaleEn,
        });
      });
    }

    return {
      ticker: c.ticker,
      name: c.profile?.name ?? c.name,
      sector: c.profile?.sector ?? c.sector,
      scores: calc?.scores ?? null,
      benefitScores: calc?.benefitScores ?? null,
      hasScores: !!calc?.scores,
      hasBenefitScores: !!calc?.benefitScores,
      profile: c.profile,
      topicScores,
    };
  });

  return { companies, allTopics };
}

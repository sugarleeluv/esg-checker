import { NextRequest } from "next/server";
import { getCompanyDetail } from "@/lib/companies";
import { SYSTEM_PROMPT } from "@/lib/chatbot/systemPrompt";
import esgKnowledge from "@/data/esgKnowledge.json";
import type { AggregatedScores, TopicScoreRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface EsgKnowledgeStructure {
  definitions: Record<string, { id: string; en: string }>;
  pillars: Record<string, { id: string; en: string }>;
  gri14: { id: string; en: string };
  scoringScale: { id: string; en: string };
  categories: Record<string, { id: string; en: string }>;
  interpretingRules: Array<{ id: string; en: string }>;
  glossary: Array<{ term: string; definitionId: string; definitionEn: string }>;
}

interface CompanyDetailData {
  ticker: string;
  name: string | null;
  sector: string | null;
  scores: AggregatedScores | null;
  benefitScores: AggregatedScores | null;
  hasScores: boolean;
  hasBenefitScores: boolean;
  costTopics: TopicScoreRow[];
  benefitTopics: TopicScoreRow[];
}

// Format static knowledge dynamically based on locale to minimize token usage
function getRelevantKnowledge(locale: "id" | "en") {
  const k = esgKnowledge as unknown as EsgKnowledgeStructure;
  const isId = locale === "id";

  const defs = Object.entries(k.definitions)
    .map(([name, obj]) => `- ${name}: ${isId ? obj.id : obj.en}`)
    .join("\n");

  const pillars = Object.entries(k.pillars)
    .map(([name, obj]) => `- ${name} Pillar: ${isId ? obj.id : obj.en}`)
    .join("\n");

  const gri = `- GRI 14 Standard: ${isId ? k.gri14.id : k.gri14.en}`;
  const scale = `- Scoring Scale: ${isId ? k.scoringScale.id : k.scoringScale.en}`;

  const cats = Object.entries(k.categories)
    .map(([name, obj]) => `- ${name} Category: ${isId ? obj.id : obj.en}`)
    .join("\n");

  const rules = k.interpretingRules.map((r) => `- ${isId ? r.id : r.en}`).join("\n");

  const glossary = k.glossary
    .map((g) => `- ${g.term}: ${isId ? g.definitionId : g.definitionEn}`)
    .join("\n");

  return `
=== STATIC ESG KNOWLEDGE ===
Definitions:
${defs}

Pillars:
${pillars}

GRI 14 Standard:
${gri}

Scoring Scale & Categories:
${scale}
${cats}

Interpretation Rules:
${rules}

Glossary:
${glossary}
`;
}

// Format dynamic scoring details to inject into system message context
function formatCompanyScoringPrompt(company: CompanyDetailData | null, locale: "id" | "en") {
  if (!company) return "";
  const isId = locale === "id";

  const costOverallStr = company.hasScores && company.scores
    ? `${(company.scores.overall * 100).toFixed(2)}% (${company.scores.overallLevel})`
    : (isId ? "Data scoring Cost belum dianalisis" : "Cost scoring data not analyzed");

  const benefitOverallStr = company.hasBenefitScores && company.benefitScores
    ? `${(company.benefitScores.overall * 100).toFixed(2)}% (${company.benefitScores.overallLevel})`
    : (isId ? "Data scoring Expected Benefit belum dianalisis" : "Expected Benefit scoring data not analyzed");

  let gapStr = "";
  if (company.hasScores && company.scores && company.hasBenefitScores && company.benefitScores) {
    const costPct = company.scores.overall * 100;
    const benefitPct = company.benefitScores.overall * 100;
    const gapVal = Math.abs(benefitPct - costPct).toFixed(2);
    if (isId) {
      gapStr = `Disclosure Completeness & Measurability Gap: ${gapVal} poin. Catatan penting: kesenjangan ini merepresentasikan perbedaan dalam tingkat kelengkapan pengungkapan dan keterukuran dampak nyata dari inisiatif keberlanjutan, bukan merupakan ukuran keuntungan finansial/profitabilitas.`;
    } else {
      gapStr = `Disclosure Completeness & Measurability Gap: ${gapVal} points. Critical note: this gap represents differences in disclosure completeness and impact measurability of sustainability commitments, rather than financial profit or profitability.`;
    }
  } else {
    gapStr = isId ? "Gap tidak tersedia." : "Gap is not available.";
  }

  let costPillarDetail = "";
  if (company.hasScores && company.scores?.pillars) {
    const p = company.scores.pillars;
    costPillarDetail = `  - Environmental (E): ${p.E !== null ? (p.E * 100).toFixed(2) + "%" : "N/A"}
  - Social (S): ${p.S !== null ? (p.S * 100).toFixed(2) + "%" : "N/A"}
  - Governance (G): ${p.G !== null ? (p.G * 100).toFixed(2) + "%" : "N/A"}`;
  }

  let benefitPillarDetail = "";
  if (company.hasBenefitScores && company.benefitScores?.pillars) {
    const p = company.benefitScores.pillars;
    benefitPillarDetail = `  - Environmental (E): ${p.E !== null ? (p.E * 100).toFixed(2) + "%" : "N/A"}
  - Social (S): ${p.S !== null ? (p.S * 100).toFixed(2) + "%" : "N/A"}
  - Governance (G): ${p.G !== null ? (p.G * 100).toFixed(2) + "%" : "N/A"}`;
  }

  const costTopicsStr = company.costTopics && company.costTopics.length > 0
    ? company.costTopics
        .map((t: TopicScoreRow) => {
          return `- ${t.topicCode} ${t.title}: Score ${t.score}/3 (${t.status})${t.rationale ? ` [Evidence: ${t.rationale}]` : ""}`;
        })
        .join("\n")
    : (isId ? "Tidak ada nilai topik Cost." : "No Cost topic scores available.");

  const benefitTopicsStr = company.benefitTopics && company.benefitTopics.length > 0
    ? company.benefitTopics
        .map((t: TopicScoreRow) => {
          return `- ${t.topicCode} ${t.title}: Score ${t.score}/3 (${t.status})${t.rationale ? ` [Evidence: ${t.rationale}]` : ""}`;
        })
        .join("\n")
    : (isId ? "Tidak ada nilai topik Expected Benefit." : "No Expected Benefit topic scores available.");

  return `
=== DYNAMIC COMPANY SCORING DATA ===
Company Ticker: ${company.ticker}
Company Name: ${company.name || company.ticker}
Sector: ${company.sector || "N/A"}

Overall ESG Cost Score: ${costOverallStr}
Cost Pillar Scores:
${costPillarDetail}

Overall ESG Expected Benefit Score: ${benefitOverallStr}
Expected Benefit Pillar Scores:
${benefitPillarDetail}

ESG Disclosure completeness/measurability gap context:
${gapStr}

Topic-Level ESG Cost Scores (GRI 14):
${costTopicsStr}

Topic-Level ESG Expected Benefit Scores (GRI 14):
${benefitTopicsStr}
`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      locale = "id",
      currentPage = "home",
      selectedCompany,
      compareCompanies,
      conversationHistory = [],
    } = body;

    // Input Validation
    if (!message || typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Message is required and must be a non-empty string" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const activeLocale: "id" | "en" = locale === "en" ? "en" : "id";

    // 1. Language constraint instructions
    const langInstruction = activeLocale === "id"
      ? "PENTING: Harap selalu menjawab pertanyaan pengguna dalam Bahasa Indonesia."
      : "IMPORTANT: Please always answer the user's questions in English.";

    // 2. Fallback Responses strictly enforced
    const fallbackInstruction = activeLocale === "id"
      ? `PENTING: Jika informasi, bukti (evidence), rincian program, alokasi nominal biaya, atau data dari topik yang ditanyakan pengguna tidak tertera dalam data scoring di bawah, jawablah secara harfiah dengan kalimat berikut (dan tidak mengarang/menjelaskan penjelasan lain):
"Informasi tersebut belum tersedia dalam data ESG Checker."`
      : `IMPORTANT: If the information, evidence, program details, nominal cost allocation, or topic data asked by the user is not present in the scoring data below, answer literally with the following sentence (and do not invent or add other explanations):
"That information is not currently available in ESG Checker."`;

    // 3. Static ESG knowledge retrieval
    const relevantKnowledge = getRelevantKnowledge(activeLocale);

    // 4. Current page and company context
    const pageContext = `
=== CURRENT CONTEXT ===
Active Locale: ${activeLocale}
Current Page: ${currentPage}
Selected Company: ${selectedCompany || "None"}
Comparison Companies: ${compareCompanies && compareCompanies.length > 0 ? compareCompanies.join(", ") : "None"}
`;

    // 5. Official Scoring Data Retrieval (from Prisma database via companies lib)
    let scoringContext = "";
    if (currentPage === "company-compare" && compareCompanies && compareCompanies.length >= 2) {
      const companyA = await getCompanyDetail(compareCompanies[0], activeLocale);
      const companyB = await getCompanyDetail(compareCompanies[1], activeLocale);
      if (companyA || companyB) {
        scoringContext = `
=== COMPARISON COMPANY DATA ===
Comparing two issuers: ${compareCompanies[0]} and ${compareCompanies[1]}.
Here are the official scores for both companies:

${companyA ? formatCompanyScoringPrompt(companyA, activeLocale) : `No data for ${compareCompanies[0]}`}

---------------------------------------------

${companyB ? formatCompanyScoringPrompt(companyB, activeLocale) : `No data for ${compareCompanies[1]}`}
`;
      }
    } else if (selectedCompany) {
      const company = await getCompanyDetail(selectedCompany, activeLocale);
      if (company) {
        scoringContext = formatCompanyScoringPrompt(company, activeLocale);
      }
    }

    // Compose System message content
    const finalSystemPrompt = `${SYSTEM_PROMPT}

${langInstruction}

${fallbackInstruction}

${relevantKnowledge}

${pageContext}

${scoringContext}
`;

    // API Keys and endpoint resolution
    let apiKey = process.env.DEEPSEEK_API_KEY;
    let baseUrl = process.env.DEEPSEEK_API_BASE || "https://api.deepseek.com/v1";
    let model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

    if (!apiKey) {
      apiKey = process.env.MIMO_API_KEY;
      baseUrl = process.env.MIMO_API_BASE || "https://api.xiaomimimo.com/v1";
      model = process.env.MIMO_MODEL || "xiaomi/mimo-v2.5";
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: activeLocale === "id"
            ? "Layanan Asisten AI tidak tersedia: API key tidak dikonfigurasi di server."
            : "AI Assistant service is unavailable: API key is not configured on the server."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call completions endpoint
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: finalSystemPrompt,
          },
          ...conversationHistory,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: activeLocale === "id"
            ? "Maaf, Layanan AI sedang tidak tersedia saat ini. Silakan coba beberapa saat lagi."
            : "Sorry, the AI Service is currently unavailable. Please try again later.",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Proxy the stream back to the client
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(chunk));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({
        error: message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
        statusText: "Internal Server Error",
      }
    );
  }
}

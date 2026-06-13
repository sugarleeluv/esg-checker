import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";
import {
  mergeBilingualBlocks,
  parseSheetCsv,
} from "../src/lib/sheet-parser";
import { refreshAllInsights } from "../src/lib/companies";
import { IDX_EMITEN } from "../src/lib/emiten-directory";

const prisma = createPrismaClient();

const SHEET_ID =
  process.env.GOOGLE_SHEET_ID ?? "1ev1efBxnUBTbxZwgPwUgTm2MsuYXUNo5dVvaiogJS7I";
const GID = process.env.GOOGLE_SHEET_GID ?? "0";

async function fetchSheetCsv(gid: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

async function main() {
  console.log("Fetching Google Sheets (Cost & Benefit)...");
  const [csvCost, csvBenefit] = await Promise.all([
    fetchSheetCsv("0"),
    fetchSheetCsv("810360985"),
  ]);

  const blocksCost = parseSheetCsv(csvCost, "COST");
  const blocksBenefit = parseSheetCsv(csvBenefit, "BENEFIT");

  const mergedCost = mergeBilingualBlocks(blocksCost);
  const mergedBenefit = mergeBilingualBlocks(blocksBenefit);

  console.log(`Parsed ${mergedCost.size} companies for Cost and ${mergedBenefit.size} for Benefit.`);

  const allowedTickers = IDX_EMITEN.map((e) => e.ticker.toUpperCase());

  // Clean up any extra companies not in IDX_EMITEN
  await prisma.companyProfile.deleteMany({
    where: { NOT: { ticker: { in: allowedTickers } } },
  });
  await prisma.companyInsight.deleteMany({
    where: { NOT: { companyTicker: { in: allowedTickers } } },
  });
  await prisma.topicScore.deleteMany({
    where: { NOT: { companyTicker: { in: allowedTickers } } },
  });
  await prisma.company.deleteMany({
    where: { NOT: { ticker: { in: allowedTickers } } },
  });

  const allTickers = new Set([
    ...Array.from(mergedCost.keys()),
    ...Array.from(mergedBenefit.keys()),
  ]);

  for (const ticker of allTickers) {
    const tickerUpper = ticker.toUpperCase();
    if (!allowedTickers.includes(tickerUpper)) {
      console.log(`Skipping ${tickerUpper}: not in allowed company list`);
      continue;
    }

    await prisma.company.upsert({
      where: { ticker: tickerUpper },
      create: { ticker: tickerUpper, sector: "Mining" },
      update: {},
    });

    // Process Cost scores
    const costData = mergedCost.get(tickerUpper);
    if (costData) {
      const primary = costData.id.length > 0 ? costData.id : costData.en;
      for (const row of primary) {
        const enRow = costData.en.find((r) => r.topicCode === row.topicCode);
        const idRow = costData.id.find((r) => r.topicCode === row.topicCode);

        await prisma.griTopic.upsert({
          where: { code: row.topicCode },
          create: {
            code: row.topicCode,
            pillar: row.pillar,
            sortOrder: Math.round(parseFloat(row.topicCode.split(".")[1]) * 10) || 0,
            titleId: idRow?.title ?? row.title,
            titleEn: enRow?.title ?? row.title,
          },
          update: {
            pillar: row.pillar,
            titleId: idRow?.title ?? row.title,
            titleEn: enRow?.title ?? row.title,
          },
        });

        await prisma.topicScore.upsert({
          where: {
            companyTicker_topicCode_type: {
              companyTicker: tickerUpper,
              topicCode: row.topicCode,
              type: "COST",
            },
          },
          create: {
            companyTicker: tickerUpper,
            topicCode: row.topicCode,
            type: "COST",
            score: row.score,
            status: row.status,
            disclosureText: row.disclosureText,
            nominalCost: row.nominalCost,
            rationaleId: idRow?.rationale ?? row.rationale,
            rationaleEn: enRow?.rationale ?? row.rationale,
          },
          update: {
            score: row.score,
            status: row.status,
            disclosureText: row.disclosureText,
            nominalCost: row.nominalCost,
            rationaleId: idRow?.rationale ?? row.rationale,
            rationaleEn: enRow?.rationale ?? row.rationale,
          },
        });
      }
    }

    // Process Benefit scores
    const benefitData = mergedBenefit.get(tickerUpper);
    if (benefitData) {
      const primary = benefitData.id.length > 0 ? benefitData.id : benefitData.en;
      for (const row of primary) {
        const enRow = benefitData.en.find((r) => r.topicCode === row.topicCode);
        const idRow = benefitData.id.find((r) => r.topicCode === row.topicCode);

        await prisma.griTopic.upsert({
          where: { code: row.topicCode },
          create: {
            code: row.topicCode,
            pillar: row.pillar,
            sortOrder: Math.round(parseFloat(row.topicCode.split(".")[1]) * 10) || 0,
            titleId: idRow?.title ?? row.title,
            titleEn: enRow?.title ?? row.title,
          },
          update: {
            pillar: row.pillar,
            titleId: idRow?.title ?? row.title,
            titleEn: enRow?.title ?? row.title,
          },
        });

        await prisma.topicScore.upsert({
          where: {
            companyTicker_topicCode_type: {
              companyTicker: tickerUpper,
              topicCode: row.topicCode,
              type: "BENEFIT",
            },
          },
          create: {
            companyTicker: tickerUpper,
            topicCode: row.topicCode,
            type: "BENEFIT",
            score: row.score,
            status: row.status,
            disclosureText: row.disclosureText,
            nominalCost: null,
            rationaleId: idRow?.rationale ?? row.rationale,
            rationaleEn: enRow?.rationale ?? row.rationale,
          },
          update: {
            score: row.score,
            status: row.status,
            disclosureText: row.disclosureText,
            nominalCost: null,
            rationaleId: idRow?.rationale ?? row.rationale,
            rationaleEn: enRow?.rationale ?? row.rationale,
          },
        });
      }
    }

    console.log(`Synced ${tickerUpper}: Cost and Benefit scores`);
  }

  console.log("Refreshing insights (id + en)...");
  await refreshAllInsights("id");
  await refreshAllInsights("en");
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

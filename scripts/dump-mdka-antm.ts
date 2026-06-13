import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";

const prisma = createPrismaClient();

async function main() {
  const mdkaInsights = await prisma.companyInsight.findMany({
    where: { companyTicker: "MDKA" },
  });
  const antmInsights = await prisma.companyInsight.findMany({
    where: { companyTicker: "ANTM" },
  });

  console.log("=== MDKA INSIGHTS ===");
  console.log(JSON.stringify(mdkaInsights, null, 2));

  console.log("=== ANTM INSIGHTS ===");
  console.log(JSON.stringify(antmInsights, null, 2));

  const mdkaScores = await prisma.topicScore.findMany({
    where: { companyTicker: "MDKA" },
    select: { topicCode: true, type: true, score: true, status: true },
  });
  const antmScores = await prisma.topicScore.findMany({
    where: { companyTicker: "ANTM" },
    select: { topicCode: true, type: true, score: true, status: true },
  });

  console.log("=== MDKA SCORES ===");
  console.log(mdkaScores.slice(0, 10));

  console.log("=== ANTM SCORES ===");
  console.log(antmScores.slice(0, 10));
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());

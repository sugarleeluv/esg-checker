import "dotenv/config";
import { Pillar } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/db";
import { IDX_EMITEN } from "../src/lib/emiten-directory";

const prisma = createPrismaClient();

const GRI_TOPICS: {
  code: string;
  pillar: Pillar;
  sortOrder: number;
  titleId: string;
  titleEn: string;
}[] = [
  { code: "14.1", pillar: "E", sortOrder: 1, titleId: "14.1 Emisi GRK", titleEn: "14.1 GHG emissions" },
  { code: "14.2", pillar: "E", sortOrder: 2, titleId: "14.2 Adaptasi Iklim", titleEn: "14.2 Climate adaptation" },
  { code: "14.3", pillar: "E", sortOrder: 3, titleId: "14.3 Emisi Udara", titleEn: "14.3 Air emissions" },
  { code: "14.4", pillar: "E", sortOrder: 4, titleId: "14.4 Keanekaragaman Hayati", titleEn: "14.4 Biodiversity" },
  { code: "14.5", pillar: "E", sortOrder: 5, titleId: "14.5 Limbah", titleEn: "14.5 Waste" },
  { code: "14.6", pillar: "E", sortOrder: 6, titleId: "14.6 Endapan (Tailings)", titleEn: "14.6 Tailings" },
  { code: "14.7", pillar: "E", sortOrder: 7, titleId: "14.7 Air dan Efluen", titleEn: "14.7 Water & effluents" },
  { code: "14.8", pillar: "E", sortOrder: 8, titleId: "14.8 Penutupan & Rehabilitasi", titleEn: "14.8 Closure & rehabilitation" },
  { code: "14.9", pillar: "S", sortOrder: 9, titleId: "14.9 Dampak Ekonomi", titleEn: "14.9 Economic impacts" },
  { code: "14.10", pillar: "S", sortOrder: 10, titleId: "14.10 Komunitas Lokal", titleEn: "14.10 Local communities" },
  { code: "14.11", pillar: "S", sortOrder: 11, titleId: "14.11 Hak-Hak Masyarakat Adat", titleEn: "14.11 Rights of Indigenous Peoples" },
  { code: "14.12", pillar: "S", sortOrder: 12, titleId: "14.12 Hak atas tanah dan sumber daya", titleEn: "14.12 Land and resource rights" },
  { code: "14.13", pillar: "S", sortOrder: 13, titleId: "14.13 Pertambangan Rakyat", titleEn: "14.13 Artisanal and small-scale mining" },
  { code: "14.14", pillar: "S", sortOrder: 14, titleId: "14.14 Praktik keamanan", titleEn: "14.14 Security practices" },
  { code: "14.15", pillar: "S", sortOrder: 15, titleId: "14.15 Manajemen krisis", titleEn: "14.15 Critical incident management" },
  { code: "14.16", pillar: "S", sortOrder: 16, titleId: "14.16 Kesehatan dan keselamatan kerja", titleEn: "14.16 Occupational health & safety" },
  { code: "14.17", pillar: "S", sortOrder: 17, titleId: "14.17 Praktik Ketenagakerjaan", titleEn: "14.17 Employment practices" },
  { code: "14.18", pillar: "S", sortOrder: 18, titleId: "14.18 s/d 14.20 Hak Pekerja", titleEn: "14.18–14.20 Workers' rights" },
  { code: "14.21", pillar: "S", sortOrder: 19, titleId: "14.21 Nondiskriminasi dan peluang kesetaraan", titleEn: "14.21 Non-discrimination and equal opportunity" },
  { code: "14.22", pillar: "G", sortOrder: 20, titleId: "14.22 Antikorupsi", titleEn: "14.22 Anti-corruption" },
  { code: "14.23", pillar: "G", sortOrder: 21, titleId: "14.23 Pembayaran Pemerintah", titleEn: "14.23 Payments to governments" },
  { code: "14.24", pillar: "G", sortOrder: 22, titleId: "14.24 Kebijakan publik", titleEn: "14.24 Public policy" },
  { code: "14.25", pillar: "G", sortOrder: 23, titleId: "14.25 Kawasan terdampak konflik dan berisiko tinggi", titleEn: "14.25 Conflict-affected and high-risk areas" },
];

async function main() {
  for (const topic of GRI_TOPICS) {
    await prisma.griTopic.upsert({
      where: { code: topic.code },
      create: topic,
      update: {
        pillar: topic.pillar,
        sortOrder: topic.sortOrder,
        titleId: topic.titleId,
        titleEn: topic.titleEn,
      },
    });
  }

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

  for (const e of IDX_EMITEN) {
    await prisma.company.upsert({
      where: { ticker: e.ticker },
      create: {
        ticker: e.ticker,
        name: e.name,
        sector: e.sector,
      },
      update: { name: e.name, sector: e.sector },
    });

    await prisma.companyProfile.upsert({
      where: { ticker: e.ticker },
      create: {
        ticker: e.ticker,
        name: e.name,
        sector: e.sector,
        listingBoard: "Main Board",
        idxRaw: JSON.parse(JSON.stringify(e)),
      },
      update: {
        name: e.name,
        sector: e.sector,
        syncedAt: new Date(),
      },
    });
  }

  console.log(`Seeded ${GRI_TOPICS.length} GRI topics and ${IDX_EMITEN.length} IDX emiten.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

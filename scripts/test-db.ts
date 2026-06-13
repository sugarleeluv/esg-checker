import "dotenv/config";
import { createPrismaClient } from "../src/lib/db";

const prisma = createPrismaClient();
prisma.company
  .findMany({
    include: {
      profile: true,
    },
  })
  .then((companies) => {
    console.log("=== COMPANIES IN DB ===");
    for (const c of companies) {
      console.log({
        ticker: c.ticker,
        name: c.name,
        sector: c.sector,
        profile: c.profile ? {
          ticker: c.profile.ticker,
          name: c.profile.name,
          sector: c.profile.sector,
          subSector: c.profile.subSector,
          idxRaw: c.profile.idxRaw,
        } : null,
      });
    }
  })
  .catch((e) => console.error("FAIL -", e))
  .finally(() => prisma.$disconnect());


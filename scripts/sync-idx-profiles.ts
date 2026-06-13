import "dotenv/config";
import type { Prisma } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/db";
import { IDX_EMITEN } from "../src/lib/emiten-directory";

const prisma = createPrismaClient();

const SHEET_ID =
  process.env.GOOGLE_SHEET_ID ?? "1ev1efBxnUBTbxZwgPwUgTm2MsuYXUNo5dVvaiogJS7I";
const PROFILE_GID = "1599931193";

async function fetchProfileSheetCsv(): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${PROFILE_GID}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

interface ParsedProfile {
  ticker: string;
  name: string;
  sector: string;
  subSector: string;
  description: string;
}

function selectBestDescription(colE: string, colF: string): string {
  const e = colE.trim();
  const f = colF.trim();
  if (!f) return e;
  if (!e) return f;

  // If F starts with E (meaning E was cut off, e.g. BBCA)
  if (f.toLowerCase().startsWith(e.toLowerCase())) {
    return f;
  }

  // If they are mostly similar (first 15 characters match, e.g. INDF)
  if (f.toLowerCase().slice(0, 15) === e.toLowerCase().slice(0, 15)) {
    return f.length > e.length ? f : e;
  }

  // Otherwise F is mismatched/shifted to another company, so return E
  return e;
}

async function main() {
  console.log("Fetching company profiles from Google Sheet GID 1599931193...");
  const csv = await fetchProfileSheetCsv();
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  
  const profiles: ParsedProfile[] = [];
  
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

  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const ticker = fields[0]?.trim() || "";
    const tickerUpper = ticker.toUpperCase();
    if (!allowedTickers.includes(tickerUpper)) {
      continue;
    }
    const name = fields[1]?.trim() || "";
    const sector = fields[2]?.trim() || "";
    const subSector = fields[3]?.trim() || "";
    const colE = fields[4] || "";
    const colF = fields[5] || "";
    const description = selectBestDescription(colE, colF);

    if (tickerUpper && name) {
      profiles.push({ ticker: tickerUpper, name, sector, subSector, description });
    }
  }

  console.log(`Parsed ${profiles.length} company profiles. Syncing with database...`);

  for (const p of profiles) {
    const tickerUpper = p.ticker.toUpperCase();
    
    // Upsert company
    await prisma.company.upsert({
      where: { ticker: tickerUpper },
      create: {
        ticker: tickerUpper,
        name: p.name,
        sector: p.sector,
      },
      update: {
        name: p.name,
        sector: p.sector,
      },
    });

    // Upsert company profile
    const idxJson: Prisma.InputJsonValue = {
      description: p.description,
    };

    await prisma.companyProfile.upsert({
      where: { ticker: tickerUpper },
      create: {
        ticker: tickerUpper,
        name: p.name,
        sector: p.sector,
        subSector: p.subSector,
        idxRaw: idxJson,
        syncedAt: new Date(),
      },
      update: {
        name: p.name,
        sector: p.sector,
        subSector: p.subSector,
        idxRaw: idxJson,
        syncedAt: new Date(),
      },
    });

    console.log(`Synced ${tickerUpper}: ${p.name}`);
  }

  console.log("Sync complete. Database is up to date with spreadsheet profiles.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

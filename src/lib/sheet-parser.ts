import type { ScoreLevel } from "@/generated/prisma/client";

export interface ParsedTopicRow {
  topicCode: string;
  pillar: "E" | "S" | "G";
  title: string;
  disclosureText: string;
  nominalCost: string;
  status: ScoreLevel;
  score: number;
  rationale: string;
  type?: "COST" | "BENEFIT";
}

export interface ParsedCompanyBlock {
  ticker: string;
  locale: "id" | "en";
  rows: ParsedTopicRow[];
}

const TICKER_RE = /^,([A-Z]{3,5}),/;

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

function extractTopicCode(title: string): string | null {
  const match = title.match(/14\.\d+/);
  return match ? match[0] : null;
}

function mapStatus(raw: string): ScoreLevel {
  const s = raw.trim().toLowerCase();
  if (s.includes("lemah") || s === "low" || s.includes("tidak tersedia") || s === "0") return "LOW";
  if (s.includes("kuat") || s === "high" || s.includes("tinggi")) return "HIGH";
  return "MEDIUM";
}

function detectLocale(blockLines: string[]): "id" | "en" {
  const sample = blockLines.join(" ").toLowerCase();
  if (
    sample.includes("high,") ||
    sample.includes(",low,") ||
    sample.includes("medium,") ||
    sample.includes("not specified")
  ) {
    return "en";
  }
  return "id";
}

function parseDataRows(
  lines: string[], 
  startIdx: number, 
  locale: "id" | "en", 
  type: "COST" | "BENEFIT" = "COST"
): ParsedTopicRow[] {
  const rows: ParsedTopicRow[] = [];

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (TICKER_RE.test(line)) break;
    if (!line.includes("14.")) continue;

    const fields = parseCsvLine(line);
    const pillar = (fields[1]?.trim() || "") as "E" | "S" | "G" | "";
    const title = fields[2]?.trim() || "";
    const topicCode = extractTopicCode(title);
    if (!topicCode) continue;

    const disclosureText = fields[3]?.trim() || "";
    
    let nominalCost = "";
    let statusRaw = "";
    let scoreRaw = "";
    let rationale = "";

    if (type === "BENEFIT") {
      statusRaw = fields[4]?.trim() || "";
      scoreRaw = fields[5]?.trim() || "";
      rationale = fields[6]?.trim() || "";
    } else {
      nominalCost = fields[4]?.trim() || "";
      statusRaw = fields[5]?.trim() || "";
      scoreRaw = fields[6]?.trim() || "";
      rationale = fields[7]?.trim() || "";
    }

    const score = parseInt(scoreRaw, 10);
    if (Number.isNaN(score) || score < 0 || score > 3) continue;

    const effectivePillar =
      pillar === "E" || pillar === "S" || pillar === "G"
        ? pillar
        : rows.length > 0
          ? rows[rows.length - 1].pillar
          : "E";

    rows.push({
      topicCode,
      pillar: effectivePillar,
      title,
      disclosureText,
      nominalCost,
      status: mapStatus(statusRaw),
      score,
      rationale,
      type,
    });
  }

  return rows;
}

export function parseSheetCsv(csv: string, type: "COST" | "BENEFIT" = "COST"): ParsedCompanyBlock[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const blocks: ParsedCompanyBlock[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const tickerMatch = lines[i].match(TICKER_RE);
    if (!tickerMatch) continue;

    const ticker = tickerMatch[1];
    const headerIdx = lines.findIndex(
      (l, idx) => idx > i && l.includes("Topik Material GRI 14")
    );
    if (headerIdx === -1) continue;

    const blockLines = lines.slice(i, i + 40);
    const locale = detectLocale(blockLines);
    const key = `${ticker}-${locale}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const rows = parseDataRows(lines, headerIdx + 1, locale, type);
    if (rows.length > 0) {
      blocks.push({ ticker, locale, rows });
    }
  }

  return blocks;
}

export function mergeBilingualBlocks(blocks: ParsedCompanyBlock[]): Map<
  string,
  {
    id: ParsedTopicRow[];
    en: ParsedTopicRow[];
  }
> {
  const merged = new Map<string, { id: ParsedTopicRow[]; en: ParsedTopicRow[] }>();

  for (const block of blocks) {
    const entry = merged.get(block.ticker) ?? { id: [], en: [] };
    if (block.locale === "en") entry.en = block.rows;
    else entry.id = block.rows;
    merged.set(block.ticker, entry);
  }

  return merged;
}

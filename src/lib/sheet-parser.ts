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

function parseCsvToRows(csv: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    const nextCh = csv[i + 1];

    if (ch === '"') {
      if (inQuotes && nextCh === '"') {
        currentField += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((ch === "\r" || ch === "\n") && !inQuotes) {
      if (ch === "\r" && nextCh === "\n") {
        i++; // skip \n
      }
      currentRow.push(currentField);
      if (currentRow.some((field) => field.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += ch;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((field) => field.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const isTickerRow = (row: string[]): boolean => {
  return row.length >= 2 && row[0] === "" && /^[A-Z]{3,5}$/.test(row[1]);
};

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

function detectLocale(blockRows: string[][]): "id" | "en" {
  const sample = blockRows.map((row) => row.join(",")).join(" ").toLowerCase();
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
  rows: string[][],
  startIdx: number,
  locale: "id" | "en",
  type: "COST" | "BENEFIT" = "COST"
): ParsedTopicRow[] {
  const result: ParsedTopicRow[] = [];

  for (let i = startIdx; i < rows.length; i++) {
    const row = rows[i];
    if (isTickerRow(row)) break;

    const hasTopic = row.some((field) => field.includes("14."));
    if (!hasTopic) continue;

    const pillar = (row[1]?.trim() || "") as "E" | "S" | "G" | "";
    const title = row[2]?.trim() || "";
    const topicCode = extractTopicCode(title);
    if (!topicCode) continue;

    const disclosureText = row[3]?.trim() || "";

    let nominalCost = "";
    let statusRaw = "";
    let scoreRaw = "";
    let rationale = "";

    if (type === "BENEFIT") {
      statusRaw = row[4]?.trim() || "";
      scoreRaw = row[5]?.trim() || "";
      rationale = row[6]?.trim() || "";
    } else {
      nominalCost = row[4]?.trim() || "";
      statusRaw = row[5]?.trim() || "";
      scoreRaw = row[6]?.trim() || "";
      rationale = row[7]?.trim() || "";
    }

    const score = parseInt(scoreRaw, 10);
    if (Number.isNaN(score) || score < 0 || score > 3) continue;

    const effectivePillar =
      pillar === "E" || pillar === "S" || pillar === "G"
        ? pillar
        : result.length > 0
          ? result[result.length - 1].pillar
          : "E";

    result.push({
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

  return result;
}

export function parseSheetCsv(csv: string, type: "COST" | "BENEFIT" = "COST"): ParsedCompanyBlock[] {
  const rows = parseCsvToRows(csv);
  const blocks: ParsedCompanyBlock[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!isTickerRow(row)) continue;

    const ticker = row[1];
    const headerIdx = rows.findIndex(
      (r, idx) =>
        idx > i &&
        (r.some((field) => field.includes("Topik Material GRI 14")) ||
          r.join(",").includes("Topik Material GRI 14"))
    );
    if (headerIdx === -1) continue;

    const blockRows = rows.slice(i, i + 40);
    const locale = detectLocale(blockRows);
    const key = `${ticker}-${locale}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const parsedRows = parseDataRows(rows, headerIdx + 1, locale, type);
    if (parsedRows.length > 0) {
      blocks.push({ ticker, locale, rows: parsedRows });
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

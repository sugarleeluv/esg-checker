import { NextRequest, NextResponse } from "next/server";
import { compareCompanies } from "@/lib/companies";
import type { Locale } from "@/lib/types";

export async function GET(request: NextRequest) {
  const tickersParam = request.nextUrl.searchParams.get("tickers");
  const locale = (request.nextUrl.searchParams.get("locale") ?? "id") as Locale;

  if (!tickersParam) {
    return NextResponse.json(
      { error: "tickers query required, e.g. tickers=MDKA,ANTM" },
      { status: 400 }
    );
  }

  const tickers = tickersParam.split(",").map((t) => t.trim()).filter(Boolean);
  if (tickers.length < 2) {
    return NextResponse.json(
      { error: "At least two tickers required" },
      { status: 400 }
    );
  }

  try {
    const result = await compareCompanies(tickers, locale);
    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to compare companies" },
      { status: 500 }
    );
  }
}

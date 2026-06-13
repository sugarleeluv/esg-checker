import { NextRequest, NextResponse } from "next/server";
import { getCompanyDetail } from "@/lib/companies";
import type { Locale } from "@/lib/types";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  const locale = (request.nextUrl.searchParams.get("locale") ?? "id") as Locale;

  try {
    const company = await getCompanyDetail(ticker, locale);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }
    return NextResponse.json({ insights: company.insights, scores: company.scores });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load insights" },
      { status: 500 }
    );
  }
}

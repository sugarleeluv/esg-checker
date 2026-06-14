import { NextResponse } from "next/server";
import { getScoringData } from "@/lib/scoringService";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getScoringData();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API error fetching scoring data:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch ESG scoring spreadsheet" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { listCompanies } from "@/lib/companies";

export async function GET() {
  try {
    const companies = await listCompanies();
    return NextResponse.json({ companies });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load companies" },
      { status: 500 }
    );
  }
}

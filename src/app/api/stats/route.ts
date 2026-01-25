import { NextResponse } from "next/server";
import { calculateStats } from "@/lib/tradeProcessor";

export async function GET() {
  try {
    const stats = await calculateStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Stats error:", error);
    return NextResponse.json(
      { error: "Failed to calculate stats", details: String(error) },
      { status: 500 }
    );
  }
}

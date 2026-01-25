import { NextResponse } from "next/server";
import { getAllTrades } from "@/lib/tradeProcessor";

export async function GET() {
  try {
    const trades = await getAllTrades();
    return NextResponse.json(trades);
  } catch (error) {
    console.error("Trades error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades", details: String(error) },
      { status: 500 }
    );
  }
}

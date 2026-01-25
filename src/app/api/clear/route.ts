import { NextResponse } from "next/server";
import { clearAllData } from "@/lib/db";

export async function POST() {
  try {
    await clearAllData();
    return NextResponse.json({ success: true, message: "All data cleared" });
  } catch (error) {
    console.error("Clear error:", error);
    return NextResponse.json(
      { error: "Failed to clear data", details: String(error) },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { processCSV } from "@/lib/tradeProcessor";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const text = await file.text();

    // Parse CSV
    const result = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
    });

    if (result.errors.length > 0) {
      return NextResponse.json(
        { error: "CSV parsing error", details: result.errors },
        { status: 400 }
      );
    }

    // Process and import data
    const { orderCount, tradeCount } = await processCSV(
      result.data as any[],
      file.name
    );

    return NextResponse.json({
      success: true,
      orderCount,
      tradeCount,
      message: `Imported ${orderCount} orders and matched ${tradeCount} trades`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file", details: String(error) },
      { status: 500 }
    );
  }
}

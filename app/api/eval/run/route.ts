import { NextResponse } from "next/server";
import { runEvals } from "@/lib/evalRunner";

export const runtime = "nodejs";

export async function POST() {
  try {
    const results = await runEvals();
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to run evals."
      },
      { status: 500 }
    );
  }
}

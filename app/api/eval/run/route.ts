import { NextResponse, after } from "next/server";
import { runEvals } from "@/lib/evalRunner";
import { flushTracing } from "@/instrumentation.node";

export const runtime = "nodejs";

export async function POST() {
  after(flushTracing);

  try {
    const results = await runEvals(`eval-suite-${Date.now()}`);
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

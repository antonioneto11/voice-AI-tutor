import { NextResponse, after } from "next/server";
import { generateTutorAnswer } from "@/lib/tutorEngine";
import { flushTracing } from "@/instrumentation.node";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Flush buffered Langfuse spans after the response is sent. In a serverless
  // runtime the process can freeze the moment we return, so an explicit flush
  // is needed to avoid losing traces.
  after(flushTracing);

  try {
    const body = (await request.json()) as {
      mode?: "teach" | "interview" | "quiz";
      input?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
      sessionId?: string;
    };

    if (!body.input?.trim()) {
      return NextResponse.json({ error: "Empty user input." }, { status: 400 });
    }

    const result = await generateTutorAnswer({
      mode: body.mode || "teach",
      input: body.input,
      history: body.history || [],
      sessionId: body.sessionId
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed model response."
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { generateTutorAnswer } from "@/lib/tutorEngine";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      mode?: "teach" | "interview" | "quiz";
      input?: string;
      history?: Array<{ role: "user" | "assistant"; content: string }>;
    };

    if (!body.input?.trim()) {
      return NextResponse.json({ error: "Empty user input." }, { status: 400 });
    }

    const result = await generateTutorAnswer({
      mode: body.mode || "teach",
      input: body.input,
      history: body.history || []
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

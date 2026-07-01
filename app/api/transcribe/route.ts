import { NextResponse, after } from "next/server";
import { getConfig, getObservedOpenAIClient } from "@/lib/openai";
import { flushTracing } from "@/instrumentation.node";
import { propagateAttributes } from "@langfuse/tracing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  after(flushTracing);

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const sessionId = formData.get("sessionId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file received." }, { status: 400 });
    }

    const config = getConfig();
    // The wrapped client records the speech-to-text call as a Langfuse
    // generation; `propagateAttributes` ties it to the conversation session.
    const client = getObservedOpenAIClient({ generationName: "speech-to-text" });

    const result = await propagateAttributes(
      {
        sessionId: typeof sessionId === "string" ? sessionId : undefined,
        traceName: "speech-to-text",
        tags: ["voice-ai-tutor", "stage:transcribe"]
      },
      () =>
        client.audio.transcriptions.create({
          file,
          model: config.transcribeModel
        })
    );

    const transcript = typeof result === "string" ? result : result.text;

    if (!transcript?.trim()) {
      return NextResponse.json({ error: "Transcription was empty." }, { status: 400 });
    }

    return NextResponse.json({ transcript });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed transcription."
      },
      { status: 500 }
    );
  }
}

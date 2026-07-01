import { NextResponse, after } from "next/server";
import { getConfig, getObservedOpenAIClient } from "@/lib/openai";
import { flushTracing } from "@/instrumentation.node";
import { propagateAttributes } from "@langfuse/tracing";

export const runtime = "nodejs";

export async function POST(request: Request) {
  after(flushTracing);

  try {
    const body = (await request.json()) as { text?: string; sessionId?: string };

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "No text provided for speech." }, { status: 400 });
    }

    const config = getConfig();
    // The wrapped client records the text-to-speech call as a Langfuse
    // generation; `propagateAttributes` ties it to the conversation session.
    const client = getObservedOpenAIClient({ generationName: "text-to-speech" });

    const speech = await propagateAttributes(
      {
        sessionId: body.sessionId,
        traceName: "text-to-speech",
        tags: ["voice-ai-tutor", "stage:speech"]
      },
      () =>
        client.audio.speech.create({
          model: config.ttsModel,
          voice: config.ttsVoice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin" | "cedar",
          input: body.text as string
        })
    );

    const buffer = Buffer.from(await speech.arrayBuffer());

    return NextResponse.json({
      audioBase64: buffer.toString("base64"),
      mimeType: "audio/mpeg"
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed text-to-speech."
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getConfig, getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { text?: string };

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "No text provided for speech." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const config = getConfig();
    const speech = await client.audio.speech.create({
      model: config.ttsModel,
      voice: config.ttsVoice as "alloy" | "ash" | "ballad" | "coral" | "echo" | "sage" | "shimmer" | "verse" | "marin" | "cedar",
      input: body.text
    });

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

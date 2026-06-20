import { NextResponse } from "next/server";
import { getConfig, getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No audio file received." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const config = getConfig();
    const result = await client.audio.transcriptions.create({
      file,
      model: config.transcribeModel
    });

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

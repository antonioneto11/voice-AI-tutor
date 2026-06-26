import OpenAI from "openai";
import { observeOpenAI } from "@langfuse/openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  if (!client) {
    client = new OpenAI({ apiKey });
  }

  return client;
}

/**
 * Return an OpenAI client wrapped with Langfuse's `observeOpenAI` helper.
 *
 * Each call automatically becomes a Langfuse `generation` (model name, token
 * usage, cost, latency, input/output) nested under whatever span is active.
 * When tracing is disabled the wrapper is a transparent pass-through, so the
 * call behaves exactly like the raw client.
 *
 * Pass `langfuseConfig` (e.g. `generationName`, `metadata`) to label the call.
 */
export function getObservedOpenAIClient(
  langfuseConfig?: Parameters<typeof observeOpenAI>[1]
) {
  return observeOpenAI(getOpenAIClient(), langfuseConfig);
}

export function getConfig() {
  return {
    transcribeModel: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
    chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4.1-mini",
    ttsModel: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
    ttsVoice: process.env.OPENAI_TTS_VOICE || "marin"
  };
}

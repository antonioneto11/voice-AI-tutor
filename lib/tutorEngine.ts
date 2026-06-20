import { getConfig, getOpenAIClient } from "@/lib/openai";
import { buildRetrievedContext, retrieveKnowledge } from "@/lib/retrieval";
import { buildGuardrailFallback, checkInputGuardrail, checkOutputGuardrail } from "@/lib/guardrails";
import { logInteraction } from "@/lib/logger";
import { buildTutorSystemPrompt, type TutorMode } from "@/lib/tutorPrompt";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateTutorAnswer({
  mode,
  input,
  history = []
}: {
  mode: TutorMode;
  input: string;
  history?: HistoryMessage[];
}) {
  const startedAt = Date.now();
  const inputGuardrail = checkInputGuardrail(input);

  if (!inputGuardrail.allowed) {
    const answer = inputGuardrail.redirect || buildGuardrailFallback(mode);
    await logInteraction({
      timestamp: new Date().toISOString(),
      mode,
      userTranscript: input,
      retrievedKnowledge: [],
      guardrailDecision: inputGuardrail.reason,
      finalAnswer: answer,
      latencyMs: Date.now() - startedAt,
      ttsStatus: "skipped"
    });

    return {
      answer,
      guardrail: inputGuardrail,
      retrieved: [],
      latencyMs: Date.now() - startedAt
    };
  }

  const retrieved = await retrieveKnowledge(input);
  const systemPrompt = buildTutorSystemPrompt(mode);
  const config = getConfig();
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model: config.chatModel,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: `${systemPrompt}\n\nRelevant knowledge:\n${buildRetrievedContext(retrieved.snippets)}`
          }
        ]
      },
      ...history.map((message) => ({
        role: message.role,
        content: [
          {
            type: "input_text" as const,
            text: message.content
          }
        ]
      })),
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: input
          }
        ]
      }
    ]
  });

  const answer = response.output_text?.trim() || buildGuardrailFallback(mode);
  const outputGuardrail = checkOutputGuardrail(answer, mode);
  const finalAnswer = outputGuardrail.allowed ? answer : buildGuardrailFallback(mode);
  const latencyMs = Date.now() - startedAt;

  await logInteraction({
    timestamp: new Date().toISOString(),
    mode,
    userTranscript: input,
    retrievedKnowledge: retrieved.names,
    guardrailDecision: outputGuardrail.allowed ? inputGuardrail.reason : outputGuardrail.reason,
    finalAnswer,
    latencyMs,
    ttsStatus: "pending"
  });

  return {
    answer: finalAnswer,
    guardrail: inputGuardrail,
    retrieved: retrieved.names,
    latencyMs
  };
}

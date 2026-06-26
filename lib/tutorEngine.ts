import { getConfig, getObservedOpenAIClient } from "@/lib/openai";
import { buildRetrievedContext, retrieveKnowledge } from "@/lib/retrieval";
import { buildGuardrailFallback, checkInputGuardrail, checkOutputGuardrail } from "@/lib/guardrails";
import { logInteraction } from "@/lib/logger";
import { buildTutorSystemPrompt, type TutorMode } from "@/lib/tutorPrompt";
import { propagateAttributes, startActiveObservation } from "@langfuse/tracing";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function generateTutorAnswer({
  mode,
  input,
  history = [],
  sessionId
}: {
  mode: TutorMode;
  input: string;
  history?: HistoryMessage[];
  sessionId?: string;
}) {
  // One tutor turn = one Langfuse trace. `propagateAttributes` attaches the
  // conversation session and filterable tags to every observation in the turn;
  // `sessionId` lets the multi-turn conversation be reconstructed in the
  // Langfuse Sessions view. The trace input is set explicitly to the user's
  // question (not the whole arg object) so it stays readable.
  return propagateAttributes(
    {
      sessionId,
      traceName: "tutor-turn",
      tags: ["voice-ai-tutor", `mode:${mode}`],
      metadata: { mode, historyLength: String(history.length) }
    },
    () =>
      startActiveObservation("tutor-turn", async (trace) => {
        trace.update({ input: { mode, question: input } });

        const startedAt = Date.now();

        const inputGuardrail = await startActiveObservation(
          "input-guardrail",
          async (span) => {
            const decision = checkInputGuardrail(input);
            span.update({
              output: { allowed: decision.allowed, reason: decision.reason }
            });
            return decision;
          }
        );

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

          trace.update({
            output: { answer, blockedBy: "input-guardrail", reason: inputGuardrail.reason }
          });

          return {
            answer,
            guardrail: inputGuardrail,
            retrieved: [],
            latencyMs: Date.now() - startedAt
          };
        }

        const retrieved = await startActiveObservation("knowledge-retrieval", async (span) => {
          const result = await retrieveKnowledge(input);
          span.update({ input: { question: input }, output: { sections: result.names } });
          return result;
        });

        const systemPrompt = buildTutorSystemPrompt(mode);
        const config = getConfig();
        // The wrapped client records this call as a Langfuse `generation`
        // (model, tokens, cost, latency) nested under the current trace.
        const openai = getObservedOpenAIClient({
          generationName: "tutor-chat-response",
          generationMetadata: { mode }
        });

        const response = await openai.responses.create({
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

        const outputGuardrail = await startActiveObservation("output-guardrail", async (span) => {
          const decision = checkOutputGuardrail(answer, mode);
          span.update({
            output: { allowed: decision.allowed, reason: decision.reason }
          });
          return decision;
        });

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

        trace.update({
          output: { answer: finalAnswer, guardrailPassed: outputGuardrail.allowed }
        });

        return {
          answer: finalAnswer,
          guardrail: inputGuardrail,
          retrieved: retrieved.names,
          latencyMs
        };
      })
  );
}

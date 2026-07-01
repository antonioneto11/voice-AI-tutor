/**
 * Node.js OpenTelemetry setup for Langfuse tracing.
 *
 * This module is imported once (from `instrumentation.ts`) when the Next.js
 * server boots in the Node runtime. It wires the `LangfuseSpanProcessor` into
 * the OpenTelemetry NodeSDK so spans created by `observeOpenAI` and our manual
 * pipeline spans are exported to Langfuse.
 *
 * Tracing is opt-in: if the Langfuse credentials are not set, nothing is
 * initialized, so the app runs exactly as before and no spans are emitted.
 */
import { NodeSDK } from "@opentelemetry/sdk-node";
import { LangfuseSpanProcessor } from "@langfuse/otel";

const tracingEnabled =
  Boolean(process.env.LANGFUSE_PUBLIC_KEY) && Boolean(process.env.LANGFUSE_SECRET_KEY);

/**
 * Redact obvious PII (emails, card-like numbers) from the input/output/metadata
 * that leaves this process. The function only touches exported trace data, not
 * the values the app actually computes with.
 */
function mask({ data }: { data: unknown }) {
  if (typeof data !== "string") {
    return data;
  }

  return data
    .replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, "[REDACTED_EMAIL]")
    .replace(/\b(?:\d[ -]*?){13,19}\b/g, "[REDACTED_CARD]");
}

// Only construct the processor / start the SDK when credentials are present.
// Constructing it without keys logs noisy warnings, so we keep it undefined.
let langfuseSpanProcessor: LangfuseSpanProcessor | undefined;

if (tracingEnabled) {
  langfuseSpanProcessor = new LangfuseSpanProcessor({ mask });

  const sdk = new NodeSDK({
    spanProcessors: [langfuseSpanProcessor],
  });

  sdk.start();
}

/**
 * Flush buffered spans. Safe to call when tracing is disabled (no-op) and never
 * throws, so route handlers can call it unconditionally (e.g. via `after()`).
 */
export async function flushTracing() {
  if (!langfuseSpanProcessor) {
    return;
  }

  try {
    await langfuseSpanProcessor.forceFlush();
  } catch {
    // Never let a tracing flush failure affect the request lifecycle.
  }
}

/**
 * Next.js instrumentation hook.
 *
 * Next.js calls `register()` once during server startup, before any route
 * handlers run. We initialize Langfuse/OpenTelemetry here (Node runtime only)
 * so all later imports execute with tracing enabled.
 *
 * Docs: https://langfuse.com/integrations/model-providers/openai-js
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation.node");
  }
}

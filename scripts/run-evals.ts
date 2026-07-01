// Initialize Langfuse/OpenTelemetry first so tutor calls in the eval run are
// traced. This script runs outside Next.js, so the `instrumentation.ts` hook
// does not fire automatically — we import the Node setup explicitly.
import { flushTracing } from "@/instrumentation.node";
import { runEvals } from "@/lib/evalRunner";

async function main() {
  const sessionId = `eval-suite-${Date.now()}`;
  const results = await runEvals(sessionId);
  console.log(JSON.stringify(results, null, 2));
  // Short-lived process: flush buffered spans before exit so none are lost.
  await flushTracing();
}

main().catch(async (error) => {
  console.error(error);
  await flushTracing();
  process.exit(1);
});

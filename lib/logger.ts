import { promises as fs } from "fs";
import path from "path";

type InteractionLog = {
  timestamp: string;
  mode: string;
  userTranscript: string;
  retrievedKnowledge: string[];
  guardrailDecision: string;
  finalAnswer: string;
  latencyMs: number;
  ttsStatus: string;
  userFeedback?: string;
};

export async function logInteraction(entry: InteractionLog) {
  const logDir = path.join(process.cwd(), "logs");
  const logFile = path.join(logDir, "interactions.jsonl");
  await fs.mkdir(logDir, { recursive: true });
  await fs.appendFile(logFile, `${JSON.stringify(entry)}\n`, "utf8");
}

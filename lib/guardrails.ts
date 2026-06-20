const allowedKeywords = [
  "llm harness",
  "harness",
  "eval",
  "evaluation",
  "rubric",
  "benchmark",
  "gold set",
  "labels",
  "agent",
  "agentic",
  "workflow",
  "rag",
  "retrieval",
  "monitoring",
  "drift",
  "failure mode",
  "human-in-the-loop",
  "human in the loop",
  "product strategy",
  "interview",
  "guardrail",
  "tool use",
  "memory",
  "orchestration",
  "sme",
  "adjudication",
  "throughput"
];

const blockedPatterns = [
  /ignore (all|previous|prior) instructions/i,
  /reveal (your|the) system prompt/i,
  /show (your|the) hidden instructions/i,
  /bypass guardrails/i,
  /how do I (hack|exploit|break into)/i,
  /malware|ransomware|credential theft/i
];

const redirectMessage =
  "I can help with AI systems, LLM evaluation, agents, and interview prep. I can’t help with that request, but I can explain the related safety or governance concept.";

export function checkInputGuardrail(input: string) {
  const normalized = input.toLowerCase();

  if (blockedPatterns.some((pattern) => pattern.test(input))) {
    return {
      allowed: false,
      reason: "unsafe-or-hidden-instructions",
      redirect: redirectMessage
    };
  }

  if (!allowedKeywords.some((keyword) => normalized.includes(keyword))) {
    return {
      allowed: false,
      reason: "out-of-scope",
      redirect: redirectMessage
    };
  }

  return {
    allowed: true,
    reason: "in-scope"
  };
}

export function checkOutputGuardrail(answer: string, mode: "teach" | "interview" | "quiz") {
  const issues: string[] = [];
  const normalized = answer.toLowerCase();

  if (!answer.trim()) {
    issues.push("Answer was empty.");
  }

  if (/\[[0-9]+\]|\baccording to a study\b|\bsource:\b/i.test(answer)) {
    issues.push("Answer appeared to imply unsupported citations.");
  }

  if (!allowedKeywords.some((keyword) => normalized.includes(keyword))) {
    issues.push("Answer drifted away from the supported AI systems scope.");
  }

  if (mode === "teach" && !normalized.includes("example")) {
    issues.push("Teach mode missed a clearly signposted example.");
  }

  if (mode === "quiz" && !/(score|good|missing|improve|question)/i.test(answer)) {
    issues.push("Quiz mode response did not look like a question or grading response.");
  }

  return {
    allowed: issues.length === 0,
    reason: issues.length ? issues.join(" ") : "ok"
  };
}

export function buildGuardrailFallback(mode: "teach" | "interview" | "quiz") {
  if (mode === "quiz") {
    return "Let’s stay inside AI systems and interview prep. Ask me to quiz you on evals, agents, RAG, drift detection, or guardrails.";
  }

  return redirectMessage;
}

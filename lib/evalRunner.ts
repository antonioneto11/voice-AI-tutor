import { promises as fs } from "fs";
import path from "path";
import { generateTutorAnswer } from "@/lib/tutorEngine";
import type { TutorMode } from "@/lib/tutorPrompt";

type EvalCase = {
  id: string;
  mode: TutorMode;
  input: string;
  must_include: string[];
  must_not_include: string[];
  expected_style: string;
};

type Rubric = {
  correctness: { max: number };
  plain_english: { max: number };
  concrete_example: { max: number };
  mode_following: { max: number };
  safety_no_hallucination: { max: number };
  passing_threshold: number;
};

async function loadJsonFile<T>(filePath: string) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

function scoreAnswer(answer: string, evalCase: EvalCase, rubric: Rubric) {
  const normalized = answer.toLowerCase();
  let score = 0;
  const reasons: string[] = [];

  const includedCount = evalCase.must_include.filter((term) => normalized.includes(term.toLowerCase())).length;
  const requiredMatches = Math.max(1, Math.ceil(evalCase.must_include.length / 2));
  const correctnessScore = Math.min(
    rubric.correctness.max,
    includedCount >= requiredMatches ? rubric.correctness.max : 1
  );
  score += correctnessScore;
  if (correctnessScore < rubric.correctness.max) {
    reasons.push("Missed some expected concepts.");
  }

  const plainEnglishScore =
    /plain english|simple definition|in simple terms|why it matters|example/i.test(answer) ||
    answer.split(" ").length < 220
      ? rubric.plain_english.max
      : 1;
  score += plainEnglishScore;
  if (plainEnglishScore < rubric.plain_english.max) {
    reasons.push("Explanation did not stay plain enough.");
  }

  const exampleScore = /\bexample\b|for example|for instance/i.test(answer)
    ? rubric.concrete_example.max
    : evalCase.expected_style.includes("example")
      ? 1
      : rubric.concrete_example.max;
  score += exampleScore;
  if (exampleScore < rubric.concrete_example.max) {
    reasons.push("Concrete example was missing or weak.");
  }

  const modeScore =
    evalCase.mode === "teach"
      ? /simple definition|why it matters|example|interview-ready explanation/i.test(answer)
      : evalCase.mode === "interview"
        ? answer.split(" ").length <= 190
        : /question|good|missing|improve|score/i.test(answer);
  score += modeScore ? rubric.mode_following.max : 0;
  if (!modeScore) {
    reasons.push("Response did not follow the selected mode closely enough.");
  }

  const safetyScore = evalCase.must_not_include.every((term) => !normalized.includes(term.toLowerCase())) ? 1 : 0;
  score += safetyScore;
  if (!safetyScore) {
    reasons.push("Response included disallowed or hallucination-prone content.");
  }

  return {
    score,
    passed: score >= rubric.passing_threshold,
    reasons: reasons.length ? reasons : ["Passed."]
  };
}

export async function runEvals(sessionId?: string) {
  const evalCasesPath = path.join(process.cwd(), "evals", "eval_cases.json");
  const rubricPath = path.join(process.cwd(), "evals", "rubric.json");
  const evalCases = await loadJsonFile<EvalCase[]>(evalCasesPath);
  const rubric = await loadJsonFile<Rubric>(rubricPath);

  const results = [];

  for (const evalCase of evalCases) {
    // Passing a shared sessionId groups every case of one eval run together in
    // the Langfuse Sessions view, so a regression sweep reads as one unit.
    const response = await generateTutorAnswer({
      mode: evalCase.mode,
      input: evalCase.input,
      history: evalCase.mode === "quiz" ? [{ role: "assistant", content: "Start a quiz for me." }] : [],
      sessionId
    });

    const scored = scoreAnswer(response.answer, evalCase, rubric);
    results.push({
      id: evalCase.id,
      mode: evalCase.mode,
      input: evalCase.input,
      score: scored.score,
      passed: scored.passed,
      reasons: scored.reasons
    });
  }

  const passedCases = results.filter((item) => item.passed).length;
  const failedCases = results.length - passedCases;

  return {
    summary: {
      totalCases: results.length,
      passedCases,
      failedCases,
      passRate: Number(((passedCases / results.length) * 100).toFixed(1))
    },
    results
  };
}

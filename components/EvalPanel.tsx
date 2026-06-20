"use client";

import { useState } from "react";

type EvalResult = {
  summary: {
    totalCases: number;
    passedCases: number;
    failedCases: number;
    passRate: number;
  };
  results: Array<{
    id: string;
    mode: string;
    input: string;
    score: number;
    passed: boolean;
    reasons: string[];
  }>;
};

export default function EvalPanel() {
  const [result, setResult] = useState<EvalResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runEvals() {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/eval/run", { method: "POST" });
      const data = (await response.json()) as EvalResult & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to run evals");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run evals");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="eval-grid">
      <div>
        <p className="mini-label">Local evals</p>
        <h2>Run a lightweight quality check against the tutor.</h2>
        <p className="muted">
          The MVP eval runner uses local cases, local rubric scoring, and the same assistant engine
          used by the chat route.
        </p>
      </div>
      <div>
        <button type="button" className="primary-button" onClick={() => void runEvals()} disabled={loading}>
          {loading ? "Running evals..." : "Run eval suite"}
        </button>
      </div>
      {error ? <p className="muted">{error}</p> : null}
      {result ? (
        <>
          <div className="eval-summary">
            <div className="eval-card">
              <p className="mini-label">Cases</p>
              <strong>{result.summary.totalCases}</strong>
            </div>
            <div className="eval-card">
              <p className="mini-label">Passed</p>
              <strong>{result.summary.passedCases}</strong>
            </div>
            <div className="eval-card">
              <p className="mini-label">Failed</p>
              <strong>{result.summary.failedCases}</strong>
            </div>
            <div className="eval-card">
              <p className="mini-label">Pass rate</p>
              <strong>{result.summary.passRate}%</strong>
            </div>
          </div>
          <div className="result-list">
            {result.results.filter((item) => !item.passed).slice(0, 8).map((item) => (
              <article key={item.id} className="result-item fail">
                <p className="mini-label">
                  {item.id} · {item.mode}
                </p>
                <strong>{item.input}</strong>
                <p className="muted">Score: {item.score}/8</p>
                <ul className="meta-list">
                  {item.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

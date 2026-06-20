# Evals

## Evals, rubrics, labels, and gold sets
An eval is the overall process for measuring system quality against a task. A rubric is the scoring guide. A label is a judgment attached to one example, such as correct or incorrect. A gold set is a trusted set of labeled examples used as the reference point for evaluation.

## Benchmarks and SME adjudication
A benchmark is a standardized test set or suite used for comparison across systems. SME adjudication means a subject matter expert reviews borderline or high-impact cases to settle disagreements, clarify the rubric, or improve label quality.

## Human-in-the-loop evaluation
Human-in-the-loop evaluation adds manual review where model outputs are risky, ambiguous, novel, or strategically important. This is common in enterprise AI, governance workflows, and regulated domains.

## Drift and failure diagnosis
Drift detection looks for changes in data, behavior, or performance over time. Failure-mode diagnosis means grouping bad outputs into patterns such as retrieval misses, tool misuse, hallucination, poor escalation, or rubric confusion.

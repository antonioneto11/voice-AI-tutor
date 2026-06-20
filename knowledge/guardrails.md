# Guardrails

## Input and output guardrails
Input guardrails check whether a request is in scope, safe, and appropriate before the model responds. Output guardrails review the answer for clarity, policy, hallucination risk, and mode-following.

## Monitoring, drift, and failure modes
Monitoring helps teams spot spikes in refusals, hallucinations, latency, tool errors, or unsafe outputs. Drift detection helps identify when user traffic, content mix, or model behavior has shifted enough that eval results no longer represent production reality.

## Governance example
In enterprise AI governance, a guardrail might route ambiguous legal-policy questions to a human reviewer, block attempts to reveal hidden prompts, and log the interaction for audit review.

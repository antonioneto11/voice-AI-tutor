# Agentic Systems

## AI agents and workflows
A workflow is a predefined sequence of steps. An AI agent is a system that can decide which step to take next based on context, goals, and tool results. Agentic systems usually combine LLM reasoning with tools, retrieval, memory, and orchestration logic.

## Agent orchestration and tool use
Agent orchestration is the control layer that routes tasks, coordinates tools, manages retries, handles approvals, and decides when to escalate to a human. Tool use means the assistant can call APIs, search systems, or structured functions instead of only generating text.

## Memory and throughput
Memory can mean short-term task state, longer-lived user context, or stored artifacts from previous runs. Agentic throughput is how much useful work an agentic system can complete over time while maintaining acceptable quality, safety, and cost.

## Monitoring and HITL
Agent systems need monitoring for latency, cost, failure rates, tool errors, escalation rates, and outcome quality. Human-in-the-loop checkpoints are useful when the task is high risk, ambiguous, or commercially sensitive.

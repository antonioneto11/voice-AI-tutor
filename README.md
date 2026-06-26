# Voice AI Tutor MVP

Voice AI Tutor is a small Next.js + TypeScript web app that helps you learn and prepare for interviews on LLM harnesses, LLM evaluation systems, AI agents, agentic systems, RAG, guardrails, monitoring, and related AI product strategy topics.

You can ask questions by voice or text, choose how the tutor responds, and optionally hear the answer spoken back to you.

## What the app does

- Uses OpenAI speech-to-text for microphone input
- Uses a configurable OpenAI chat model in a modular tutor service
- Uses OpenAI text-to-speech for spoken playback
- Supports three learning modes:
  - `Teach me simply`
  - `Interview answer`
  - `Quiz me`
- Uses local markdown files in `/knowledge` as the MVP knowledge base
- Applies lightweight input and output guardrails
- Logs interactions locally to `logs/interactions.jsonl`
- Includes a small local eval suite with a terminal runner and an in-app eval panel

## Project structure

```text
voice-ai-tutor/
  app/
    page.tsx
    api/
      transcribe/route.ts
      chat/route.ts
      speech/route.ts
      eval/run/route.ts
  components/
    VoiceRecorder.tsx
    ChatWindow.tsx
    ModeSelector.tsx
    ResponseCard.tsx
    EvalPanel.tsx
  lib/
    openai.ts
    guardrails.ts
    tutorPrompt.ts
    retrieval.ts
    evalRunner.ts
    logger.ts
    tutorEngine.ts
  knowledge/
    llm_harness.md
    evals.md
    agentic_systems.md
    guardrails.md
    rag.md
    interview_answers.md
  evals/
    eval_cases.json
    rubric.json
  logs/
    interactions.jsonl
  scripts/
    run-evals.ts
```

## Install dependencies

```bash
npm install
```

## Environment variables

Create `.env.local` in the project root:

```bash
OPENAI_API_KEY=
OPENAI_TRANSCRIBE_MODEL=gpt-4o-mini-transcribe
OPENAI_CHAT_MODEL=gpt-4.1-mini
OPENAI_TTS_MODEL=gpt-4o-mini-tts
OPENAI_TTS_VOICE=marin

# Optional: Langfuse tracing (leave blank to disable)
LANGFUSE_PUBLIC_KEY=
LANGFUSE_SECRET_KEY=
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

You can switch the voice to `cedar` if you prefer. See `.env.local.example` for the full list.

## Observability (Langfuse)

The app is instrumented with [Langfuse](https://langfuse.com) for LLM tracing. Tracing is
**opt-in**: set `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY` / `LANGFUSE_BASE_URL` to enable it.
With the keys unset, the app behaves exactly as before and emits no traces.

What gets traced:

- **`tutor-turn`** — one trace per chat turn, with nested spans for the input guardrail,
  knowledge retrieval, the OpenAI chat `generation` (model, tokens, cost, latency), and the
  output guardrail. Trace input/output are set to the user question and final answer.
- **`speech-to-text`** and **`text-to-speech`** — the OpenAI audio calls, traced as generations.
- **Sessions** — the transcribe → chat → speech calls of one browser session share a
  `sessionId`, so a full conversation is viewable in the Langfuse **Sessions** view. Each turn is
  tagged with its `mode` (`teach` / `interview` / `quiz`) for filtering.
- **Masking** — emails and card-like numbers are redacted from exported trace data.

Instrumentation is initialized once via Next.js's `instrumentation.ts` hook
(`@langfuse/otel` + `@opentelemetry/sdk-node`), and OpenAI calls are wrapped with
`observeOpenAI` from `@langfuse/openai`. Each API route flushes spans with `after()` so nothing
is lost in the serverless runtime. The eval runner (`npm run evals`) is traced too and groups a
run under one session.

## Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## How to use voice mode

1. Click `Start microphone`.
2. Allow microphone access in the browser.
3. Ask a question about the supported AI systems topics.
4. Click `Stop and transcribe`.
5. The app will transcribe your speech, generate an answer, and optionally play audio back.

## How to use text fallback

1. Type your question in the text area.
2. Choose a mode.
3. Click `Ask tutor`.

## Learning modes

### Teach me simply

Broad concept questions return:

- Simple definition
- Why it matters
- Example
- Interview-ready explanation

### Interview answer

Returns a concise, polished spoken answer suitable for an interview.

### Quiz me

The tutor asks one question at a time, waits for your answer, then grades it and explains:

- What was good
- What was missing
- How to improve

## Run evals

From the terminal:

```bash
npm run evals
```

From the app:

- Use the `Run eval suite` button in the Eval panel.

## Logging

Each interaction logs:

- Timestamp
- Mode
- User transcript
- Retrieved knowledge section
- Guardrail decision
- Final answer
- Latency
- TTS status
- Optional user feedback field for future use

Logs are saved locally in `logs/interactions.jsonl`.

## Guardrails

The MVP includes:

- Input scope checks for AI systems and interview-prep topics
- Redirects for off-topic, unsafe, or prompt-extraction requests
- Output checks for clarity, mode following, safety, and unsupported citation patterns

## Intentionally not included in the MVP

- Authentication
- Production database
- Persistent cross-session memory
- Advanced analytics
- Vector database
- OpenAI File Search integration
- True realtime speech-to-speech
- Full eval tracing and experiment dashboards

## Future upgrade path

- Replace the modular voice pipeline with the OpenAI Realtime API using `gpt-realtime-2`
- Add OpenAI File Search or vector-store retrieval
- Add richer guardrail tracing and evaluation telemetry
- Add persistent memory and analytics
- Add auth, role separation, and production logging infrastructure

## Notes

- The app is designed to be modular so audio, reasoning, retrieval, guardrails, and evals can evolve independently.
- TODO comments are included in the code where a production feature would naturally slot in next.

"use client";

import { useEffect, useRef, useState } from "react";
import ChatWindow from "@/components/ChatWindow";
import EvalPanel from "@/components/EvalPanel";
import ModeSelector from "@/components/ModeSelector";
import ResponseCard from "@/components/ResponseCard";
import VoiceRecorder from "@/components/VoiceRecorder";

type Mode = "teach" | "interview" | "quiz";
type Status = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatApiResponse = {
  answer: string;
  guardrail: {
    allowed: boolean;
    reason: string;
    redirect?: string;
  };
  retrieved: string[];
  latencyMs: number;
};

const starterMessages: Message[] = [
  {
    role: "assistant",
    content:
      "Choose a mode and ask about LLM harnesses, evals, AI agents, guardrails, RAG, monitoring, or interview prep. You can type or use the microphone."
  }
];

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("teach");
  const [messages, setMessages] = useState<Message[]>(starterMessages);
  const [input, setInput] = useState("");
  const [transcript, setTranscript] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRetrieved, setLastRetrieved] = useState<string[]>([]);
  const [lastLatency, setLastLatency] = useState<number | null>(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  async function playSpeech(text: string) {
    if (isMuted || !ttsEnabled) {
      return;
    }

    setStatus("speaking");

    try {
      const response = await fetch("/api/speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      });

      if (!response.ok) {
        throw new Error("Failed text-to-speech");
      }

      const { audioBase64, mimeType } = (await response.json()) as {
        audioBase64: string;
        mimeType: string;
      };

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(`data:${mimeType};base64,${audioBase64}`);
      audioRef.current = audio;
      audio.onended = () => setStatus("idle");
      audio.onerror = () => {
        setStatus("error");
        setError("Audio playback failed. You can still read the answer.");
      };
      await audio.play();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed audio playback");
    }
  }

  async function sendMessage(rawInput?: string) {
    const prompt = (rawInput ?? input).trim();

    if (!prompt) {
      setError("Please enter a question or record your voice first.");
      return;
    }

    setError("");
    setStatus("thinking");
    setIsSubmitting(true);

    const nextMessages: Message[] = [...messages, { role: "user", content: prompt }];
    setMessages(nextMessages);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          input: prompt,
          history: messages.slice(-8)
        })
      });

      const data = (await response.json()) as ChatApiResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed model response");
      }

      setMessages((current) => [...current, { role: "assistant", content: data.answer }]);
      setLastRetrieved(data.retrieved);
      setLastLatency(data.latencyMs);

      if (data.guardrail.allowed && !isMuted && ttsEnabled) {
        await playSpeech(data.answer);
      } else {
        setStatus("idle");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed model response");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAudioReady(blob: Blob) {
    setError("");
    setStatus("transcribing");

    try {
      const formData = new FormData();
      formData.append("file", blob, "question.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData
      });

      const data = (await response.json()) as { transcript?: string; error?: string };

      if (!response.ok || !data.transcript) {
        throw new Error(data.error || "Failed transcription");
      }

      setTranscript(data.transcript);
      setInput(data.transcript);
      await sendMessage(data.transcript);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed transcription");
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Voice AI Tutor MVP</p>
          <h1>Learn LLM evals, AI agents, and interview answers out loud.</h1>
          <p className="hero-text">
            This tutor is built for clear explanations, strong interview answers, and quiz-style
            practice across LLM harnesses, evaluation systems, RAG, agent orchestration, guardrails,
            and AI product strategy.
          </p>
        </div>
        <ResponseCard
          status={status}
          transcript={transcript}
          error={error}
          isMuted={isMuted}
          ttsEnabled={ttsEnabled}
          onToggleMuted={() => setIsMuted((value) => !value)}
          onToggleTts={() => setTtsEnabled((value) => !value)}
          retrieved={lastRetrieved}
          latencyMs={lastLatency}
        />
      </section>

      <section className="workspace-grid">
        <div className="panel stack-gap">
          <ModeSelector mode={mode} onChange={setMode} />
          <VoiceRecorder
            disabled={isSubmitting}
            onAudioReady={handleAudioReady}
            onStatusChange={setStatus}
            onError={setError}
          />
          <div className="input-stack">
            <label className="field-label" htmlFor="question-input">
              Text fallback
            </label>
            <textarea
              id="question-input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about LLM harnesses, drift detection, human-in-the-loop evaluation, or interview prep."
              rows={5}
            />
            <button className="primary-button" onClick={() => void sendMessage()} disabled={isSubmitting}>
              {isSubmitting ? "Working..." : mode === "quiz" ? "Continue quiz" : "Ask tutor"}
            </button>
          </div>
        </div>

        <div className="panel tall-panel">
          <ChatWindow messages={messages} />
        </div>
      </section>

      <section className="panel">
        <EvalPanel />
      </section>
    </main>
  );
}

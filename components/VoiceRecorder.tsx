"use client";

import { useRef, useState } from "react";

type Status = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

export default function VoiceRecorder({
  disabled,
  onAudioReady,
  onStatusChange,
  onError
}: {
  disabled: boolean;
  onAudioReady: (blob: Blob) => Promise<void>;
  onStatusChange: (status: Status) => void;
  onError: (message: string) => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    try {
      onError("");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        onStatusChange("error");
        onError("Audio recording failed. Please try again.");
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setIsRecording(false);
        await onAudioReady(blob);
      };

      recorder.start();
      setIsRecording(true);
      onStatusChange("listening");
    } catch (error) {
      onStatusChange("error");
      onError(
        error instanceof Error && error.name === "NotAllowedError"
          ? "Microphone permission denied. You can keep using text input."
          : "Unable to access your microphone."
      );
    }
  }

  function stopRecording() {
    if (!recorderRef.current || recorderRef.current.state === "inactive") {
      return;
    }

    recorderRef.current.stop();
  }

  return (
    <div className="stack-gap">
      <div>
        <p className="mini-label">Voice input</p>
        <h3>Ask by voice or switch to text anytime.</h3>
      </div>
      <div className="recorder-controls">
        <button
          type="button"
          className="record-button"
          onClick={() => void startRecording()}
          disabled={disabled || isRecording}
        >
          {isRecording ? "Listening..." : "Start microphone"}
        </button>
        <button
          type="button"
          className="stop-button"
          onClick={stopRecording}
          disabled={disabled || !isRecording}
        >
          Stop and transcribe
        </button>
      </div>
      <p className="muted">
        MVP flow: record, transcribe, answer, and optionally read the answer aloud. TODO: upgrade
        this pipeline to realtime speech-to-speech with the Realtime API later.
      </p>
    </div>
  );
}

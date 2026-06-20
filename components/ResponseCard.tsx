type Status = "idle" | "listening" | "transcribing" | "thinking" | "speaking" | "error";

const statusLabels: Record<Status, string> = {
  idle: "Ready",
  listening: "Listening",
  transcribing: "Transcribing",
  thinking: "Thinking",
  speaking: "Speaking",
  error: "Needs attention"
};

export default function ResponseCard({
  status,
  transcript,
  error,
  isMuted,
  ttsEnabled,
  onToggleMuted,
  onToggleTts,
  retrieved,
  latencyMs
}: {
  status: Status;
  transcript: string;
  error: string;
  isMuted: boolean;
  ttsEnabled: boolean;
  onToggleMuted: () => void;
  onToggleTts: () => void;
  retrieved: string[];
  latencyMs: number | null;
}) {
  return (
    <aside className="status-card">
      <div className={`status-pill ${status === "error" ? "error" : status === "speaking" ? "speaking" : ""}`}>
        {statusLabels[status]}
      </div>
      <div>
        <p className="mini-label">Live transcript</p>
        <p className="status-copy">
          {transcript || "Your transcript will appear here after speech-to-text completes."}
        </p>
      </div>
      {error ? (
        <div>
          <p className="mini-label">Error</p>
          <p className="status-copy">{error}</p>
        </div>
      ) : null}
      <div className="toggle-row">
        <button type="button" className="chip-button" onClick={onToggleMuted}>
          {isMuted ? "Unmute audio" : "Mute audio"}
        </button>
        <button type="button" className="chip-button" onClick={onToggleTts}>
          {ttsEnabled ? "Disable TTS" : "Enable TTS"}
        </button>
      </div>
      <div className="meta-grid">
        <div className="meta-card">
          <span className="mini-label">Latency</span>
          <strong>{latencyMs ? `${latencyMs} ms` : "No request yet"}</strong>
        </div>
        <div className="meta-card">
          <span className="mini-label">Knowledge</span>
          <strong>{retrieved.length ? `${retrieved.length} section(s)` : "Awaiting question"}</strong>
        </div>
      </div>
      <div>
        <p className="mini-label">Retrieved focus</p>
        {retrieved.length ? (
          <ul className="meta-list">
            {retrieved.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="status-copy">Relevant markdown sections will be listed here.</p>
        )}
      </div>
    </aside>
  );
}

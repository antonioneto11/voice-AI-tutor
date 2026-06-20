type Mode = "teach" | "interview" | "quiz";

const modeDescriptions: Record<Mode, string> = {
  teach: "Teach me simply",
  interview: "Interview answer",
  quiz: "Quiz me"
};

export default function ModeSelector({
  mode,
  onChange
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <div className="stack-gap">
      <div>
        <p className="mini-label">Mode selector</p>
        <h2>Choose how the tutor should respond.</h2>
      </div>
      <div className="mode-grid">
        {(Object.keys(modeDescriptions) as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`mode-button ${mode === item ? "active" : ""}`}
            onClick={() => onChange(item)}
          >
            {modeDescriptions[item]}
          </button>
        ))}
      </div>
      <p className="muted">
        Teach mode uses simple definitions and examples. Interview mode gives polished spoken
        answers. Quiz mode asks one question at a time and grades your response.
      </p>
    </div>
  );
}

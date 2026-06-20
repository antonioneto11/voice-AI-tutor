export default function ChatWindow({
  messages
}: {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  return (
    <div className="chat-window">
      <div>
        <p className="mini-label">Tutor conversation</p>
        <h2>Chat-style answers and coaching</h2>
      </div>
      <div className="chat-log">
        {messages.map((message, index) => (
          <article key={`${message.role}-${index}`} className={`message-bubble ${message.role}`}>
            <p className="message-role">{message.role === "assistant" ? "Tutor" : "You"}</p>
            <p>{message.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

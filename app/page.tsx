"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I’m your travel assistant. Ask me about destinations, attractions, weather, visa information, or travel duration.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    setInput("");

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        role: "user",
        text,
      },
    ]);

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
        }),
      });

      const data = await response.json();

      console.log("Frontend API response:", data);

      if (!response.ok) {
        throw new Error(
          data?.error ||
          data?.details ||
          "Something went wrong."
        );
      }

      const assistantReply =
        data?.reply ||
        data?.text ||
        "The workflow completed but returned an empty response.";

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: assistantReply,
        },
      ]);
    } catch (error) {
      console.error("Frontend chat error:", error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text:
            error instanceof Error
              ? `Sorry, I couldn't get a response. ${error.message}`
              : "Sorry, I couldn't get a response.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="chat-shell">
        <header className="header">
          <div className="brand-icon">✈</div>

          <div>
            <h1>Travel Assistant</h1>
            <p>Powered by your CogitX workflow</p>
          </div>

          <span className="status">
            <i /> Online
          </span>
        </header>

        <div className="messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`row ${message.role}`}
            >
              <div className="bubble">
                {message.role === "assistant" ? (
                  <div className="markdown-content">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                    >
                      {message.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  message.text
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="row assistant">
              <div className="bubble typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        <form
          className="composer"
          onSubmit={sendMessage}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a destination..."
            disabled={loading}
            autoComplete="off"
          />

          <button
            disabled={loading || !input.trim()}
            aria-label="Send"
          >
            {loading ? "…" : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}
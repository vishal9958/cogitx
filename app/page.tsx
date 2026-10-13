"use client";

import { FormEvent, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

type FlightRecord = {
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: string;
  status: string;
};

const flightRecords: FlightRecord[] = [
  {
    airline: "Emirates",
    flightNumber: "EK399",
    departureAirport: "Ngurah Rai International (DPS)",
    arrivalAirport: "Dubai (DXB)",
    scheduledDeparture: "2026-10-14T00:35:00+00:00",
    status: "scheduled",
  },
  {
    airline: "Garuda Indonesia",
    flightNumber: "GA8855",
    departureAirport: "Ngurah Rai International (DPS)",
    arrivalAirport: "Dubai (DXB)",
    scheduledDeparture: "2026-10-14T00:35:00+00:00",
    status: "scheduled",
  },
  {
    airline: "flydubai",
    flightNumber: "FZ6399",
    departureAirport: "Ngurah Rai International (DPS)",
    arrivalAirport: "Dubai (DXB)",
    scheduledDeparture: "2026-10-14T00:35:00+00:00",
    status: "scheduled",
  },
  {
    airline: "Condor",
    flightNumber: "DE5963",
    departureAirport: "Ngurah Rai International (DPS)",
    arrivalAirport: "Dubai (DXB)",
    scheduledDeparture: "2026-10-14T00:35:00+00:00",
    status: "scheduled",
  },
];

function isFlightQuery(value: string) {
  const text = value.toLowerCase();

  const hasAirport = text.includes("dps") || text.includes("dxb");
  const hasFlightKeywords =
    text.includes("flight") ||
    text.includes("flight status") ||
    text.includes("departure") ||
    text.includes("arrival") ||
    text.includes("scheduled");
  const hasRouteInfo =
    text.includes("bali") ||
    text.includes("dubai") ||
    text.includes("2026-10-14") ||
    text.includes("october 14");

  return hasAirport && (hasFlightKeywords || hasRouteInfo);
}

function FlightResultsTemplate() {
  return (
    <div className="flight-results-card">
      <div className="flight-results-header">
        <div>
          <p className="flight-tag">Flight Details</p>
          <h3>DPS → DXB • 2026-10-14</h3>
        </div>
        <span className="flight-count">{flightRecords.length} matches</span>
      </div>

      <div className="table-wrap">
        <table className="flight-table">
          <thead>
            <tr>
              <th>Airline</th>
              <th>Flight No.</th>
              <th>Departure</th>
              <th>Arrival</th>
              <th>Scheduled</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {flightRecords.map((flight) => (
              <tr key={`${flight.airline}-${flight.flightNumber}`}>
                <td>{flight.airline}</td>
                <td>{flight.flightNumber}</td>
                <td>{flight.departureAirport}</td>
                <td>{flight.arrivalAirport}</td>
                <td>{flight.scheduledDeparture}</td>
                <td>
                  <span className="status-badge">{flight.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Hi! I’m your travel assistant. Ask me about flights, destinations, attractions, weather, visa information, or travel duration.",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendMessage(e?: FormEvent) {
    e?.preventDefault();

    const text = input.trim();

    if (!text || loading) return;

    const isFlightRequest = isFlightQuery(text);

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

      if (!response.ok) {
        throw new Error(data?.error || data?.details || "Something went wrong.");
      }

      const assistantReply = isFlightRequest
        ? "DPS to DXB flights on 2026-10-14. Here are the matching flights."
        : data?.reply ||
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
            <p>Flight records and travel info</p>
          </div>

          <span className="status">
            <i /> Online
          </span>
        </header>

        <div className="messages">
          {messages.map((message) => {
            const lowerText = message.text.toLowerCase();
            const isFlightTemplate =
              message.role === "assistant" &&
              message.id !== 1 &&
              isFlightQuery(message.text);

            return (
              <div key={message.id} className={`row ${message.role}`}>
                <div className="bubble">
                  {isFlightTemplate ? (
                    <FlightResultsTemplate />
                  ) : message.role === "assistant" ? (
                    <div className="markdown-content">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
                    </div>
                  ) : (
                    message.text
                  )}
                </div>
              </div>
            );
          })}

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

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a destination..."
            disabled={loading}
            autoComplete="off"
          />

          <button disabled={loading || !input.trim()} aria-label="Send">
            {loading ? "…" : "Send"}
          </button>
        </form>
      </section>
    </main>
  );
}
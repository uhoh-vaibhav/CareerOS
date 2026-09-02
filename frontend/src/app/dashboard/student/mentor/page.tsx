"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { sendMentorMessageRequest, getMentorHistoryRequest, MentorSession } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

// Sessions are stored as a single "Q: ...\nA: ..." summary string — split
// that back into two bubbles for display.
function sessionToMessages(session: MentorSession): ChatMessage[] {
  const match = session.summary.match(/^Q: ([\s\S]*)\nA: ([\s\S]*)$/);
  if (!match) return [];
  return [
    { role: "user", text: match[1] },
    { role: "assistant", text: match[2] },
  ];
}

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getMentorHistoryRequest()
      .then((sessions) => setMessages(sessions.flatMap(sessionToMessages)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setHistoryLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text }]);
    setSending(true);

    try {
      const res = await sendMentorMessageRequest(text);
      setMessages((prev) => [...prev, { role: "assistant", text: res.reply }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 bg-white flex flex-col max-w-3xl">
          <h1 className="text-2xl font-bold text-navy mb-1">AI Career Mentor</h1>
          <p className="text-sm text-gray-600 mb-4">
            Your mentor remembers past conversations — try asking a follow-up question.
          </p>

          <div className="flex-1 border border-ice rounded-xl p-4 overflow-y-auto space-y-3 min-h-[400px] max-h-[55vh]">
            {historyLoading && <p className="text-sm text-gray-400 italic">Loading conversation history…</p>}
            {!historyLoading && messages.length === 0 && (
              <p className="text-sm text-gray-400 italic">
                No conversation yet — ask your first question below.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-navy text-white" : "bg-ice text-navy"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="max-w-[75%] rounded-xl px-3 py-2 text-sm bg-ice text-navy italic">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

          <div className="flex gap-2 mt-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question…"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={sending || !input.trim()}
              className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}

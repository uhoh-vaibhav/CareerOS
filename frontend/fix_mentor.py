with open("src/app/dashboard/student/mentor/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_ui = """"use client";

import { useEffect, useRef, useState } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { sendMentorMessageRequest, getMentorHistoryRequest, MentorSession } from "@/lib/api";

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function sessionToMessages(session: MentorSession): ChatMessage[] {
  let qText = "";
  let aText = "";
  const aIndex = session.summary.indexOf("\\nA: ");
  if (aIndex !== -1) {
    qText = session.summary.substring(0, aIndex).replace(/^Q:\\s*/, "");
    aText = session.summary.substring(aIndex + 4);
  } else if (session.summary.startsWith("Q:")) {
    qText = session.summary.replace(/^Q:\\s*/, "");
    aText = "[Response formatting error in history]";
  } else {
    return [{ role: "assistant", text: session.summary }];
  }
  return [
    { role: "user", text: qText.trim() },
    { role: "assistant", text: aText.trim() },
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
  }, [messages, sending]);

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 flex flex-col items-center p-6 h-[calc(100vh-64px)]">
          <div className="w-full max-w-4xl h-full flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Header */}
            <div className="border-b border-gray-100 bg-white p-5 flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-navy flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  AI Career Mentor
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  Your personalized career coach. It remembers your goals and past chats.
                </p>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/50">
              {historyLoading && (
                <div className="flex justify-center my-8">
                  <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-xs font-bold text-gray-400 shadow-sm animate-pulse">
                    Syncing conversation history...
                  </span>
                </div>
              )}
              
              {!historyLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-50">
                  <div className="text-4xl">??</div>
                  <h3 className="font-bold text-navy">Start a conversation</h3>
                  <p className="text-xs text-gray-500">Ask about interview prep, resume tips, or career strategy.</p>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[80%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold shadow-sm ${
                      m.role === "user" 
                        ? "bg-navy text-white text-xs" 
                        : "bg-blue-600 text-white text-[10px]"
                    }`}>
                      {m.role === "user" ? "YOU" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      m.role === "user" 
                        ? "bg-navy text-white rounded-tr-sm" 
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                    }`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-[10px] shadow-sm">
                      AI
                    </div>
                    <div className="px-5 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-400 rounded-tl-sm shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} className="h-4" />
            </div>

            {/* Error Area */}
            {error && (
              <div className="bg-red-50 border-t border-red-100 p-2 text-center text-xs text-red-600 font-bold">
                {error}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="flex gap-3">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask your mentor a question..."
                  className="flex-1 border border-gray-300 rounded-xl px-5 py-3 text-sm focus:ring-2 focus:ring-navy outline-none shadow-sm transition-all"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !input.trim()}
                  className="btn-primary rounded-xl px-6 py-3 font-bold shadow-sm"
                >
                  Send
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                AI can make mistakes. Verify important career advice.
              </p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/mentor/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_ui)

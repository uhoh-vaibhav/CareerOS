"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { sendMentorMessageRequest, getMentorHistoryRequest, MentorSession, getLatestSkillGapRequest, getRoadmapRequest, getReadinessScoreRequest } from "@/lib/api";
import { marked } from "marked";

// SSR-safe: DOMPurify requires `window` which doesn't exist during Next.js server rendering
const createDOMPurify = () => {
  if (typeof window !== "undefined") {
    const DOMPurify = require("dompurify");
    return DOMPurify;
  }
  return { sanitize: (html: string) => html };
};

interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

function sessionToMessages(session: MentorSession): ChatMessage[] {
  let qText = "";
  let aText = "";
  const aIndex = session.summary.indexOf("\nA: ");
  if (aIndex !== -1) {
    qText = session.summary.substring(0, aIndex).replace(/^Q:\s*/, "");
    aText = session.summary.substring(aIndex + 4);
  } else if (session.summary.startsWith("Q:")) {
    qText = session.summary.replace(/^Q:\s*/, "");
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

  // Context Data
  const [targetRole, setTargetRole] = useState<string>("Not Set");
  const [currentMilestone, setCurrentMilestone] = useState<string>("None");
  const [roadmapPct, setRoadmapPct] = useState<number>(0);
  const [skillGaps, setSkillGaps] = useState<number>(0);
  const [readiness, setReadiness] = useState<number>(0);
  const [contextLoaded, setContextLoaded] = useState(false);

  useEffect(() => {
    // Check for pre-filled query param
    const params = new URLSearchParams(window.location.search);
    const ask = params.get('ask');
    if (ask && contextLoaded) {
      // Clear URL to avoid re-triggering on refresh
      window.history.replaceState({}, document.title, window.location.pathname);
      setInput(ask);
    }
  }, [contextLoaded]);

  useEffect(() => {
    // Load history
    getMentorHistoryRequest()
      .then((sessions) => setMessages(sessions.flatMap(sessionToMessages)))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load history"))
      .finally(() => setHistoryLoading(false));

    // Load Context for sidebar and dynamic prompts
    Promise.allSettled([
      getLatestSkillGapRequest(),
      getRoadmapRequest(),
      getReadinessScoreRequest()
    ]).then(([sgRes, rmRes, readRes]) => {
      let rPct = 0;
      let gaps = 0;
      let role = "Not Set";
      let milestone = "None";

      if (sgRes.status === "fulfilled" && sgRes.value) {
        role = sgRes.value.report.targetRole;
        const missing = sgRes.value.report.missingSkills;
        if (Array.isArray(missing)) {
          gaps = missing.length;
        } else if ((missing as any)?.missingSkills) {
          gaps = (missing as any).missingSkills.length;
        }
      }

      if (rmRes.status === "fulfilled" && rmRes.value) {
        rPct = rmRes.value.progressPct;
        const phases = rmRes.value.milestones as any[];
        if (Array.isArray(phases)) {
          let found = false;
          for (let p of phases) {
            if (Array.isArray(p.subtasks)) {
              for (let st of p.subtasks) {
                if (!st.isCompleted) {
                  milestone = st.title;
                  found = true;
                  break;
                }
              }
            } else {
              if (!p.isCompleted) {
                milestone = p.title;
                found = true;
                break;
              }
            }
            if (found) break;
          }
        }
      }

      if (readRes.status === "fulfilled" && readRes.value) {
        setReadiness(readRes.value.compositeScore);
      }

      setTargetRole(role);
      setSkillGaps(gaps);
      setRoadmapPct(rPct);
      setCurrentMilestone(milestone);
      setContextLoaded(true);
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function handleSend(forcedText?: string) {
    const text = (forcedText || input).trim();
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

  // Dynamic Suggested Prompts based on context
  let prompts = ["What should I learn first?", "How can I improve my resume?"];
  if (currentMilestone !== "None") {
    prompts = [
      `Explain ${currentMilestone}`,
      "Create a 7-day study plan",
      "What should I learn next?"
    ];
  } else if (targetRole !== "Not Set") {
    prompts = [
      `What does a ${targetRole} do daily?`,
      "How can I close my skill gaps?",
      "Review my resume weak points"
    ];
  }

  function renderMarkdown(text: string) {
    try {
      const purify = createDOMPurify();
      const rawHtml = marked.parse(text, { async: false }) as string;
      const cleanHtml = purify.sanitize(rawHtml, { ADD_ATTR: ['target'] });
      // Add target="_blank" to all links
      const withTargets = cleanHtml.replace(/<a /g, '<a target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold hover:text-blue-800 transition-colors" ');
      return { __html: withTargets };
    } catch (e) {
      return { __html: text };
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        
        <main className="flex-1 flex flex-col md:flex-row gap-6 p-4 md:p-6 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* Left Chat Area */}
          <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden h-full">
            
            {/* Header */}
            <div className="border-b border-gray-100 bg-white p-5 flex items-center justify-between shadow-sm z-10">
              <div>
                <h1 className="text-xl font-black text-navy flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-sm"></span>
                  AI Career Mentor
                </h1>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  Personalized guidance using your CareerOS progress
                </p>
              </div>
              
              {contextLoaded && (
                <div className="hidden sm:flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full" title="Your mentor can use your latest resume analysis, skill gap and roadmap.">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-700">CareerOS Context On</span>
                  <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
              )}
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-gray-50/30">
              {historyLoading && (
                <div className="flex justify-center my-8">
                  <span className="px-4 py-2 bg-white border border-gray-200 rounded-full text-[10px] uppercase tracking-widest font-black text-gray-400 shadow-sm animate-pulse">
                    Syncing conversation history...
                  </span>
                </div>
              )}
              
              {!historyLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-70">
                  <div className="text-5xl">🎓</div>
                  <h3 className="font-bold text-navy">Start your career coaching</h3>
                  
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4">
                    {prompts.map(p => (
                      <button 
                        key={p} 
                        onClick={() => handleSend(p)}
                        className="bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`flex gap-3 max-w-[90%] md:max-w-[75%] ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    
                    {/* Avatar */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-black shadow-sm ${
                      m.role === "user" 
                        ? "bg-navy text-white text-[10px]" 
                        : "bg-blue-600 text-white text-[10px]"
                    }`}>
                      {m.role === "user" ? "YOU" : "AI"}
                    </div>

                    {/* Bubble */}
                    <div className={`px-5 py-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
                      m.role === "user" 
                        ? "bg-navy text-white rounded-tr-sm whitespace-pre-wrap" 
                        : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm markdown-body"
                    }`}
                    dangerouslySetInnerHTML={m.role === "user" ? undefined : renderMarkdown(m.text)}
                    >
                      {m.role === "user" ? m.text : undefined}
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
                    <div className="px-5 py-3.5 rounded-3xl bg-white border border-gray-200 text-gray-400 rounded-tl-sm shadow-sm flex items-center gap-1.5">
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
              <div className="bg-red-50 border-t border-red-100 p-2 text-center text-[10px] text-red-600 font-bold uppercase tracking-widest">
                {error}
              </div>
            )}

            {/* Suggested Prompts if chat is active */}
            {!historyLoading && messages.length > 0 && !sending && (
              <div className="bg-gray-50/50 px-4 py-3 flex gap-2 overflow-x-auto hide-scrollbar border-t border-gray-100">
                {prompts.map(p => (
                  <button 
                    key={p} 
                    onClick={() => handleSend(p)}
                    className="whitespace-nowrap bg-white border border-gray-200 hover:border-blue-300 hover:text-blue-700 text-gray-600 text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm transition-all flex-shrink-0"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-gray-200 z-10">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your mentor anything..."
                    className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-5 py-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none shadow-inner transition-all"
                    disabled={sending}
                  />
                </div>
                <button
                  onClick={() => handleSend()}
                  aria-label="Send message"
                  disabled={sending || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-2xl px-6 py-4 font-black shadow-md transition-all flex items-center justify-center shrink-0"
                >
                  Send
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-3 font-bold uppercase tracking-widest">
                AI can make mistakes. Verify important career advice.
              </p>
            </div>

          </div>

          {/* Right Context Panel (Desktop Only) */}
          {contextLoaded && (
            <div className="hidden lg:flex w-72 flex-col space-y-4 shrink-0">
              <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Your Career Context</h3>
                
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Target Role</span>
                    <span className="text-sm font-bold text-navy bg-gray-50 px-2 py-1 rounded-md block border border-gray-100">{targetRole}</span>
                  </div>
                  
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Current Milestone</span>
                    <span className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-md block border border-blue-100">{currentMilestone}</span>
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Roadmap</span>
                      <span className="text-xs font-black text-navy">{roadmapPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${roadmapPct}%` }}></div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Skill Gaps</span>
                      <span className="text-xl font-black text-amber-600">{skillGaps}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-0.5">Readiness</span>
                      <span className="text-xl font-black text-green-600">{readiness}%</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Link href="/dashboard/student/roadmap" className="block text-center w-full bg-gray-50 hover:bg-gray-100 text-gray-600 font-bold text-xs py-2 rounded-xl border border-gray-200 transition-colors">
                      View Full Roadmap
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

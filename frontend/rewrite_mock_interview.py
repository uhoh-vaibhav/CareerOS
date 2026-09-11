import os

new_code = """
"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { generateMockInterviewRequest, evaluateMockInterviewRequest, MockInterviewEvaluateResponse, QuestionAnswer } from "@/lib/api";

const KNOWN_ROLES = [
  "Software Engineer", "Backend Developer", "Frontend Developer", 
  "Full Stack Developer", "Data Scientist", "Machine Learning Engineer",
  "DevOps Engineer", "Product Manager"
];

export default function MockInterviewPage() {
  const [targetRole, setTargetRole] = useState(KNOWN_ROLES[0]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [result, setResult] = useState<MockInterviewEvaluateResponse | null>(null);

  // Web Speech API states
  const [isListeningTo, setIsListeningTo] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup speech recognition on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = (index: number) => {
    if (isListeningTo === index) {
      // Stop current recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListeningTo(null);
      return;
    }

    // If another is active, stop it first
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support the Web Speech API. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setAnswers(prev => {
          const newAnswers = [...prev];
          const current = newAnswers[index];
          newAnswers[index] = current ? current + " " + finalTranscript.trim() : finalTranscript.trim();
          return newAnswers;
        });
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setIsListeningTo(null);
    };

    recognition.onend = () => {
      // Auto-stop in UI if it stops naturally (silence)
      setIsListeningTo((prev) => (prev === index ? null : prev));
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsListeningTo(index);
  };

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    setResult(null);
    setQuestions([]);
    setAnswers([]);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningTo(null);
    }
    
    try {
      const res = await generateMockInterviewRequest(targetRole);
      setQuestions(res.questions);
      setAnswers(res.questions.map(() => ""));
    } catch (err: any) {
      setError(err.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListeningTo(null);
    }
    setError(null);
    setLoading(true);
    
    try {
      const qaPairs: QuestionAnswer[] = questions.map((q, i) => ({
        question: q,
        answer: answers[i]
      }));
      
      const res = await evaluateMockInterviewRequest(targetRole, qaPairs);
      setResult(res);
      setQuestions([]); // Clear form to show only result
    } catch (err: any) {
      setError(err.message || "Failed to evaluate answers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-4 bg-background max-w-3xl">
          <h1 className="text-2xl font-bold text-navy">AI Mock Interview (Voice Enabled)</h1>
          <p className="text-sm text-text-muted">
            Select a role and our AI will generate personalized interview questions. 
            Speak or type your answers to get real-time feedback and a score.
          </p>

          {!questions.length && !result && (
            <Card title="Start an Interview">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Target role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    {KNOWN_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="btn-primary text-sm"
                >
                  {loading ? "Generating..." : "Generate Questions"}
                </button>
              </div>
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </Card>
          )}

          {questions.length > 0 && !result && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-navy border-b pb-2">
                Interview Questions for {targetRole}
              </h2>
              {questions.map((q, i) => (
                <div key={i} className="bg-gray-50 p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-start mb-3">
                    <p className="font-medium text-navy flex-1 pr-4">{i + 1}. {q}</p>
                    <button
                      onClick={() => toggleListening(i)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all shadow-sm border ${
                        isListeningTo === i 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {isListeningTo === i ? (
                        <>
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                          Stop Listening
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                          Voice Answer
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-navy outline-none transition-shadow"
                    placeholder="Type or dictate your answer here..."
                    value={answers[i]}
                    onChange={(e) => {
                      const newAnswers = [...answers];
                      newAnswers[i] = e.target.value;
                      setAnswers(newAnswers);
                    }}
                  />
                </div>
              ))}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (recognitionRef.current) recognitionRef.current.stop();
                    setIsListeningTo(null);
                    setQuestions([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || answers.some(a => !a.trim())}
                  className="btn-primary text-sm"
                >
                  {loading ? "Evaluating..." : "Submit Answers"}
                </button>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              <Card title="Interview Results" tone="gold">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Technical Score */}
                  <div className="bg-white border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
                    <div className="text-4xl font-bold text-navy">
                      {result.score}/100
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Technical Score</span>
                      <span className="text-xs text-text-muted">Accuracy & Depth</span>
                    </div>
                  </div>

                  {/* Confidence Score */}
                  {typeof result.feedback !== "string" && result.feedback?.confidenceScore !== undefined && (
                    <div className="bg-white border border-border p-5 rounded-xl shadow-sm flex items-center gap-4">
                      <div className="text-4xl font-bold text-accent">
                        {result.feedback.confidenceScore}/100
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800 uppercase tracking-wide">Confidence Score</span>
                        <span className="text-xs text-text-muted">Clarity & Delivery</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Communication Feedback */}
                {typeof result.feedback !== "string" && result.feedback?.communicationFeedback && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                    <h3 className="font-bold text-navy text-sm mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                      Communication Analysis
                    </h3>
                    <p className="text-sm text-gray-700">{result.feedback.communicationFeedback}</p>
                  </div>
                )}

                <div className="border-t pt-4">
                  <h3 className="font-bold text-navy mb-3">Detailed Technical Feedback</h3>
                  <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                    {typeof result.feedback === "string" ? result.feedback : (result.feedback?.feedback ?? "No detailed feedback provided.")}
                  </div>
                </div>
              </Card>

              <button
                onClick={() => setResult(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-colors"
              >
                Start New Interview
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/mock-interview/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_code)

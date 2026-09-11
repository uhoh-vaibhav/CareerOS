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

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MockInterviewPage() {
  const [targetRole, setTargetRole] = useState(KNOWN_ROLES[0]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MockInterviewEvaluateResponse | null>(null);

  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    let timer: any;
    if (questions.length > 0 && !result && !loading) {
      timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [questions.length, result, loading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
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
          const current = newAnswers[currentQuestionIdx];
          newAnswers[currentQuestionIdx] = current ? current + " " + finalTranscript.trim() : finalTranscript.trim();
          return newAnswers;
        });
      }
    };

    recognition.onerror = (e: any) => {
      console.error("Speech recognition error", e);
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  async function handleGenerate() {
    setError(null); setLoading(true); setResult(null);
    setQuestions([]); setAnswers([]); setTimeElapsed(0); setCurrentQuestionIdx(0);
    if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }
    
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
    if (recognitionRef.current) { recognitionRef.current.stop(); setIsListening(false); }
    setError(null); setLoading(true);
    
    try {
      const qaPairs: QuestionAnswer[] = questions.map((q, i) => ({ question: q, answer: answers[i] }));
      const res = await evaluateMockInterviewRequest(targetRole, qaPairs);
      setResult(res);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate answers");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
          
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-navy">AI Mock Interview</h1>
            <p className="text-gray-600 mt-2 text-lg">Practice realistic interview questions and receive AI-powered feedback.</p>
          </div>

          {!questions.length && !result && (
            <Card title="Start an Interview">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full border-gray-300 rounded-xl px-4 py-3 text-base focus:ring-2 focus:ring-navy focus:border-navy"
                  >
                    {KNOWN_ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
                <button onClick={handleGenerate} disabled={loading} className="btn-primary py-3 px-8 text-base w-full md:w-auto whitespace-nowrap">
                  {loading ? "Generating..." : "Generate Questions"}
                </button>
              </div>
              {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
            </Card>
          )}

          {questions.length > 0 && !result && (
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Main Panel */}
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-navy">
                      Question {currentQuestionIdx + 1} of {questions.length}
                    </span>
                    <span className="text-sm font-medium text-gray-500">Role: {targetRole}</span>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
                    {questions[currentQuestionIdx]}
                  </h3>
                  
                  <div className="relative">
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-4 text-base min-h-[200px] focus:ring-2 focus:ring-navy outline-none resize-y"
                      placeholder="Type your answer here or use dictation..."
                      value={answers[currentQuestionIdx]}
                      onChange={(e) => {
                        const newAnswers = [...answers];
                        newAnswers[currentQuestionIdx] = e.target.value;
                        setAnswers(newAnswers);
                      }}
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-medium">{answers[currentQuestionIdx].split(/\s+/).filter(x => x.length > 0).length} words</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center">
                    <button
                      onClick={toggleListening}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                        isListening 
                        ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100' 
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {isListening ? (
                        <><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span></span> Stop Dictation</>
                      ) : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg> Start Dictation</>
                      )}
                    </button>
                  </div>
                  
                  <div className="mt-10 pt-6 border-t border-gray-100 flex justify-between items-center">
                    <button 
                      onClick={() => { if(isListening) toggleListening(); setCurrentQuestionIdx(i => Math.max(0, i - 1)); }}
                      disabled={currentQuestionIdx === 0}
                      className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    
                    {currentQuestionIdx < questions.length - 1 ? (
                      <button 
                        onClick={() => { if(isListening) toggleListening(); setCurrentQuestionIdx(i => Math.min(questions.length - 1, i + 1)); }}
                        className="btn-primary px-8 py-2.5"
                      >
                        Save & Next
                      </button>
                    ) : (
                      <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-green-600 text-white hover:bg-green-700 px-8 py-2.5 rounded-xl font-medium transition-colors shadow-sm disabled:opacity-70"
                      >
                        {loading ? "Submitting..." : "Finish Interview"}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-80 space-y-6">
                <Card title="Interview Session">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 text-sm">Time Elapsed</span>
                      <span className="font-mono font-bold text-navy">{formatTime(timeElapsed)}</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">{Math.round((answers.filter(a => a.trim().length > 0).length / questions.length) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-navy h-2 rounded-full transition-all" style={{ width: `${(answers.filter(a => a.trim().length > 0).length / questions.length) * 100}%` }}></div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-3">Questions</p>
                      <div className="flex flex-col gap-2">
                        {questions.map((_, idx) => (
                          <button 
                            key={idx}
                            onClick={() => { if(isListening) toggleListening(); setCurrentQuestionIdx(idx); }}
                            className={`flex items-center justify-between p-2 rounded-lg text-sm text-left transition-colors ${
                              currentQuestionIdx === idx ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50 border border-transparent'
                            }`}
                          >
                            <span className={`font-medium ${currentQuestionIdx === idx ? 'text-navy' : 'text-gray-600'}`}>
                              Question {idx + 1}
                            </span>
                            {answers[idx].trim().length > 0 ? (
                              <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card title="Interview Tips">
                  <ul className="text-sm text-gray-600 space-y-3 list-disc pl-4">
                    <li>Use the <strong>STAR</strong> method for behavioral questions (Situation, Task, Action, Result).</li>
                    <li>Think out loud for technical problem solving.</li>
                    <li>You can record your answer or type it.</li>
                    <li>Review your answers before submitting.</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {result && (
            <div className="space-y-6">
              {loading && <p className="text-navy font-semibold text-center py-10">Analyzing your interview...</p>}
              
              {!loading && (
                <>
                  <Card title="Interview Results" tone="gold">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex items-center gap-5">
                        <div className="text-5xl font-extrabold text-navy">
                          {result.score}/100
                        </div>
                        <div className="flex flex-col">
                          <span className="text-base font-bold text-gray-800 uppercase tracking-wide">Technical Score</span>
                          <span className="text-sm text-text-muted">Accuracy & Depth</span>
                        </div>
                      </div>

                      {typeof result.feedback !== "string" && result.feedback?.confidenceScore !== undefined && (
                        <div className="bg-white border border-border p-6 rounded-2xl shadow-sm flex items-center gap-5">
                          <div className="text-5xl font-extrabold text-accent">
                            {result.feedback.confidenceScore}/100
                          </div>
                          <div className="flex flex-col">
                            <span className="text-base font-bold text-gray-800 uppercase tracking-wide">Confidence Score</span>
                            <span className="text-sm text-text-muted">Clarity & Delivery</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {typeof result.feedback !== "string" && result.feedback?.communicationFeedback && (
                      <div className="mb-8 p-5 bg-blue-50 border border-blue-100 rounded-xl">
                        <h3 className="font-bold text-navy text-sm mb-2 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                          Communication Analysis
                        </h3>
                        <p className="text-sm text-gray-700 leading-relaxed">{result.feedback.communicationFeedback}</p>
                      </div>
                    )}

                    <div className="border-t border-gray-100 pt-6">
                      <h3 className="font-bold text-xl text-navy mb-6">Detailed Feedback</h3>
                      
                      {typeof result.feedback !== "string" && result.feedback?.qa ? (
                        <div className="space-y-8">
                          {result.feedback.qa.map((qa, i) => (
                            <div key={i} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">Q{i+1}: {qa.question}</h4>
                              <div className="mb-4 p-3 bg-white border rounded-lg text-sm text-gray-600">
                                <span className="font-medium text-gray-800 block mb-1">Your Answer:</span>
                                {qa.answer || <span className="italic text-gray-400">No answer provided.</span>}
                              </div>
                            </div>
                          ))}
                          <div className="mt-6 prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                            {result.feedback.feedback}
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-gray-700">
                          {typeof result.feedback === "string" ? result.feedback : (result.feedback?.feedback ?? "No detailed feedback provided.")}
                        </div>
                      )}
                    </div>
                  </Card>

                  <div className="flex gap-4">
                    <button
                      onClick={() => {
                        setResult(null);
                        setQuestions([]);
                        setAnswers([]);
                      }}
                      className="btn-primary px-6 py-2.5"
                    >
                      Start New Interview
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

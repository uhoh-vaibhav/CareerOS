"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { uploadResumeRequest, getLatestResumeRequest, ResumeParseResult } from "@/lib/api";

const CRITERION_LABELS: Record<string, { label: string; max: number; color: string }> = {
  formatting: { label: "Formatting & Parsing", max: 25, color: "bg-blue-500" },
  keywords: { label: "Keyword Optimization", max: 25, color: "bg-green-500" },
  content: { label: "Content & Impact", max: 25, color: "bg-purple-500" },
  structure: { label: "Section Structure", max: 25, color: "bg-orange-500" },
};

export default function ResumeAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ResumeParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getLatestResumeRequest()
      .then((data) => setResult(data))
      .catch((err) => console.error("Failed to fetch latest resume", err))
      .finally(() => setLoadingInitial(false));
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a PDF resume first.");
      return;
    }
    setError(null);
    setUploading(true);

    try {
      const res = await uploadResumeRequest(file);
      setResult(res);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  // Helper to extract the new advanced JSON format
  const advanced = (result?.parsed as any)?.raw_json;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 p-6 space-y-6 bg-background overflow-y-auto">
            <div>
              <h1 className="text-2xl font-bold text-navy">Resume Analysis</h1>
              <p className="text-sm text-text-muted mt-1">
                Upload your resume for an instant, recruiter-grade ATS evaluation.
              </p>
            </div>

            <Card title="Upload New Resume" tone="blue">
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-sm border border-border rounded-lg p-2 w-full"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={uploading || !file}
                    className="btn-primary text-sm"
                  >
                    {uploading ? "Analyzing..." : "Analyze Resume"}
                  </button>
                </div>
              </form>
            </Card>

            {loadingInitial ? (
              <p className="text-sm text-text-muted">Loading your latest analysis...</p>
            ) : result ? (
              advanced ? (
                // --- ADVANCED ATS UI ---
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card title="ATS Compatibility Score" tone="gold">
                      <div className="flex flex-col items-center justify-center p-4">
                        <div className="text-5xl font-black text-navy mb-2">
                          {advanced.ats_score}<span className="text-2xl text-gray-400">/100</span>
                        </div>
                        <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                          advanced.ats_score >= 80 ? "bg-green-100 text-green-700" :
                          advanced.ats_score >= 60 ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {advanced.score_label || "Score"}
                        </span>
                        {advanced.analysis_confidence && (
                          <p className="text-xs text-gray-500 mt-2">Confidence: {advanced.analysis_confidence}</p>
                        )}
                      </div>
                    </Card>
                    
                    <Card title="Recruiter First Impression" tone="blue">
                      <p className="text-sm text-gray-800 italic border-l-4 border-blue-500 pl-4 py-1">
                        "{advanced.candidate_profile?.recruiter_first_impression}"
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {advanced.candidate_profile?.strongest_areas?.map((area: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100">
                            ? {area}
                          </span>
                        ))}
                      </div>
                    </Card>
                  </div>

                  <Card title="Section Scores" tone="green">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                      {advanced.section_scores && Object.entries(advanced.section_scores).map(([key, section]: [string, any]) => {
                        const maxScore = section.max_score || 1;
                        const pct = Math.round(((section.score || 0) / maxScore) * 100);
                        const safePct = isNaN(pct) ? 0 : Math.min(pct, 100);
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-700 font-medium capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="font-bold text-navy">{section.score || 0}/{maxScore}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                              <div
                                className={`h-2 rounded-full ${safePct >= 80 ? 'bg-green-500' : safePct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${safePct}%` }}
                              />
                            </div>
                            {section.reason && <p className="text-[10px] text-gray-500 leading-tight">{section.reason}</p>}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {advanced.top_improvements && advanced.top_improvements.length > 0 && (
                    <Card title="Top Priority Improvements" tone="gold">
                      <div className="space-y-4">
                        {advanced.top_improvements.map((imp: any, i: number) => (
                          <div key={i} className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                            <h4 className="font-bold text-amber-900 text-sm mb-1">Priority {imp.priority}: {imp.issue}</h4>
                            <p className="text-sm text-gray-700 mb-2">{imp.why_it_matters}</p>
                            <p className="text-sm font-medium text-amber-800">Action: {imp.recommended_action}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {advanced.strengths && advanced.strengths.length > 0 && (
                      <Card title="Strengths" tone="green">
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          {advanced.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                        </ul>
                      </Card>
                    )}
                    {advanced.weaknesses && advanced.weaknesses.length > 0 && (
                      <Card title="Weaknesses" tone="blue">
                        <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                          {advanced.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                        </ul>
                      </Card>
                    )}
                  </div>
                  
                  {advanced.recruiter_verdict && (
                    <Card title="Final Verdict" tone="blue">
                      <p className="font-bold text-navy mb-2">Shortlist Readiness: {advanced.recruiter_verdict.shortlist_readiness}</p>
                      <p className="text-sm text-gray-700">{advanced.recruiter_verdict.reason}</p>
                    </Card>
                  )}
                </div>
              ) : (
                // --- LEGACY ATS UI ---
                <>
                  <Card title="ATS Compatibility Score" tone="gold">
                    <div className="flex items-center gap-4 mb-4">
                      <p className="text-4xl font-bold text-text-main">
                        {result.parsed.ats_score}/100
                      </p>
                      <span className={`text-sm font-medium ${
                        result.parsed.ats_score >= 70 ? "text-green-600" :
                        result.parsed.ats_score >= 45 ? "text-amber-600" :
                        "text-red-600"
                      }`}>
                        {result.parsed.ats_score >= 70 ? "Good" :
                         result.parsed.ats_score >= 45 ? "Needs Improvement" :
                         "Low - Needs Work"}
                      </span>
                    </div>
                    {result.parsed.ats_breakdown && (
                      <div className="space-y-2">
                        {Object.entries(result.parsed.ats_breakdown).map(([key, value]) => {
                          const info = CRITERION_LABELS[key];
                          if (!info) return null;
                          const pct = Math.round((value / info.max) * 100);
                          return (
                            <div key={key}>
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-text-muted">{info.label}</span>
                                <span className="font-semibold text-navy">
                                  {value}/{info.max}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`${info.color} h-2 rounded-full transition-all duration-500`}
                                  style={{ width: `${Math.min(pct, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                  <Card title="AI Feedback" tone="green">
                    <p className="whitespace-pre-line text-sm">{result.parsed.feedback}</p>
                  </Card>
                </>
              )
            ) : (
              <p className="text-sm text-text-muted italic">No resume uploaded yet.</p>
            )}
          </main>

          {/* Right Column: PDF Viewer */}
          {result && (
            <aside className="flex-1 bg-gray-50 hidden lg:flex flex-col border-l border-border max-w-xl">
              <div className="p-4 border-b border-border bg-white flex justify-between items-center">
                <h2 className="text-sm font-semibold text-navy">Resume Preview</h2>
                <a 
                  href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${result.resume.fileUrl}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  Open PDF
                </a>
              </div>
              <div className="flex-1 p-4 h-full">
                <object
                  data={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}${result.resume.fileUrl}`}
                  type="application/pdf"
                  className="w-full h-full rounded-xl border border-border shadow-sm bg-white"
                >
                  <div className="flex items-center justify-center h-full text-sm text-text-muted">
                    Unable to display PDF preview.
                  </div>
                </object>
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { uploadResumeRequest, ResumeParseResult } from "@/lib/api";

const CRITERION_LABELS: Record<string, { label: string; max: number; color: string }> = {
  contact_info:        { label: "Contact Info",        max: 10, color: "bg-blue-500" },
  sections:            { label: "Resume Sections",     max: 20, color: "bg-indigo-500" },
  skills_keywords:     { label: "Skills & Keywords",   max: 25, color: "bg-green-500" },
  action_verbs:        { label: "Action Verbs",        max: 10, color: "bg-teal-500" },
  quantifiable_impact: { label: "Quantifiable Impact", max: 10, color: "bg-purple-500" },
  length_density:      { label: "Length & Density",     max: 15, color: "bg-amber-500" },
  formatting:          { label: "Formatting",           max: 10, color: "bg-orange-500" },
};

export default function ResumePage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ResumeParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const res = await uploadResumeRequest(file);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-4 bg-white max-w-2xl">
          <h1 className="text-2xl font-bold text-navy">Resume Upload &amp; Analysis</h1>

          <div className="border-2 border-dashed border-ice rounded-xl p-6 text-center space-y-3">
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <p className="text-xs text-gray-500">PDF or plain text, up to 5MB.</p>
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Analyzing\u2026" : "Upload & Analyze"}
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3">
              {error}
            </p>
          )}

          {result && (
            <>
              {/* ── ATS Score ── */}
              <Card title="ATS Compatibility Score" tone="gold">
                <div className="flex items-baseline gap-3 mb-3">
                  <p className="text-3xl font-bold text-navy">
                    {result.parsed.ats_score}/100
                  </p>
                  <span className={`text-sm font-medium ${
                    result.parsed.ats_score >= 70 ? "text-green-600" :
                    result.parsed.ats_score >= 45 ? "text-amber-600" :
                    "text-red-600"
                  }`}>
                    {result.parsed.ats_score >= 70 ? "Good" :
                     result.parsed.ats_score >= 45 ? "Needs Improvement" :
                     "Low — Needs Work"}
                  </span>
                </div>

                {/* Breakdown bars */}
                {result.parsed.ats_breakdown && (
                  <div className="space-y-2">
                    {Object.entries(result.parsed.ats_breakdown).map(([key, value]) => {
                      const info = CRITERION_LABELS[key];
                      if (!info) return null;
                      const pct = Math.round((value / info.max) * 100);
                      return (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-0.5">
                            <span className="text-gray-600">{info.label}</span>
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

              {/* ── Detected Skills ── */}
              <Card title="Detected Skills" tone="blue">
                <div className="flex flex-wrap gap-2">
                  {result.parsed.skills.length === 0 && (
                    <span className="text-gray-500 italic">No known skills detected.</span>
                  )}
                  {result.parsed.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-1 rounded-full bg-white border border-navy/20 text-xs text-navy"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                {result.parsed.skills.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    {result.parsed.skills.length} skill{result.parsed.skills.length === 1 ? "" : "s"} detected
                  </p>
                )}
              </Card>

              {/* ── Feedback ── */}
              <Card title="AI Feedback" tone="green">
                <p className="whitespace-pre-line">{result.parsed.feedback}</p>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

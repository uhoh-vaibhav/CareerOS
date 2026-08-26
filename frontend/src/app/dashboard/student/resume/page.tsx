"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { uploadResumeRequest, ResumeParseResult } from "@/lib/api";

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
              <Card title="ATS Score" tone="gold">
                <p className="text-3xl font-bold text-navy">{result.parsed.ats_score}/100</p>
              </Card>

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
              </Card>

              <Card title="Feedback" tone="green">
                <p>{result.parsed.feedback}</p>
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

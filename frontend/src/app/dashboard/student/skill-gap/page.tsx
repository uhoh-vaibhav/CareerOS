"use client";

import { useState } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { analyzeSkillGapRequest, SkillGapResult } from "@/lib/api";

// Matches the role-skills table in ai-service/app/services/skill_gap_service.py.
// Free text is accepted too, but these are guaranteed to have real gap data behind them.
const KNOWN_ROLES = [
  // Software Engineering
  "Backend Developer",
  "Frontend Developer",
  "Full Stack Developer",
  "Software Engineer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  // Data & AI / ML
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  // Cloud & DevOps
  "DevOps Engineer",
  "Cloud Engineer",
  "Site Reliability Engineer",
  // Security
  "Cybersecurity Analyst",
  "Penetration Tester",
  // QA & Testing
  "QA Engineer",
  // Design & Product
  "UI/UX Designer",
  "Product Manager",
  // Database
  "Database Administrator",
  // Blockchain & Emerging
  "Blockchain Developer",
  // Networking
  "Network Engineer",
  // Business Intelligence
  "Business Analyst",
];

export default function SkillGapPage() {
  const [targetRole, setTargetRole] = useState(KNOWN_ROLES[0]);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAnalyze() {
    setError(null);
    setLoading(true);
    try {
      const res = await analyzeSkillGapRequest(targetRole);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-4 bg-white max-w-2xl">
          <h1 className="text-2xl font-bold text-navy">Skill Gap Analysis</h1>
          <p className="text-sm text-gray-600">
            Compares the skills detected from your most recently uploaded resume against
            a target role.
          </p>

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Target role</label>
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {KNOWN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Analyzing\u2026" : "Analyze"}
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg p-3">
              {error}
              {error.toLowerCase().includes("resume") && (
                <>
                  {" "}
                  <a href="/dashboard/student/resume" className="underline font-medium">
                    Upload one here.
                  </a>
                </>
              )}
            </div>
          )}

          {result && (
            <>
              <Card title="Skills Used From Your Resume" tone="blue">
                <div className="flex flex-wrap gap-2">
                  {result.currentSkills.length === 0 && (
                    <span className="text-gray-500 italic">None detected.</span>
                  )}
                  {result.currentSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 rounded-full bg-white border border-navy/20 text-xs text-navy">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              <Card title={`Missing Skills for ${result.report.targetRole}`} tone="gold">
                <div className="flex flex-wrap gap-2">
                  {result.report.missingSkills.length === 0 && (
                    <span className="text-green-700 font-medium">
                      No gaps found — your skills already match this role.
                    </span>
                  )}
                  {result.report.missingSkills.map((skill) => (
                    <span key={skill} className="px-2 py-1 rounded-full bg-white border border-amber-600/30 text-xs text-amber-800">
                      {skill}
                    </span>
                  ))}
                </div>
              </Card>

              <Card title="Learning Roadmap" tone="green">
                {(() => {
                  const milestones = result.report.roadmap?.milestones;
                  if (!milestones || (Array.isArray(milestones) && milestones.length === 0)) {
                    return <p>No roadmap generated.</p>;
                  }
                  if (Array.isArray(milestones)) {
                    return (
                      <div className="space-y-2">
                        {milestones.slice(0, 3).map((m: any, i: number) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="font-semibold text-navy flex-shrink-0">Step {m.step}:</span>
                            <span className="text-gray-700">{m.title}</span>
                          </div>
                        ))}
                        {milestones.length > 3 && (
                          <p className="text-xs text-gray-400">+{milestones.length - 3} more steps</p>
                        )}
                        <a
                          href="/dashboard/student/roadmap"
                          className="inline-block mt-1 text-xs text-accent underline font-medium"
                        >
                          View full roadmap →
                        </a>
                      </div>
                    );
                  }
                  // Legacy format: plain text
                  return <p>{typeof milestones === "object" && "text" in milestones ? (milestones as any).text : String(milestones)}</p>;
                })()}
              </Card>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

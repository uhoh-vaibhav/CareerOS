with open("src/app/dashboard/student/skill-gap/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_ui = """"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { analyzeSkillGapRequest, SkillGapResult } from "@/lib/api";

const KNOWN_ROLES = [
  "Backend Developer", "Frontend Developer", "Full Stack Developer", "Software Engineer", 
  "Mobile App Developer", "Android Developer", "iOS Developer", "Data Analyst", 
  "Data Scientist", "Data Engineer", "Machine Learning Engineer", "AI Engineer", 
  "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer", "Cybersecurity Analyst", 
  "Penetration Tester", "QA Engineer", "UI/UX Designer", "Product Manager", 
  "Database Administrator", "Blockchain Developer", "Network Engineer", "Business Analyst"
];

export default function SkillGapPage() {
  const [targetRole, setTargetRole] = useState(KNOWN_ROLES[0]);
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    import("@/lib/api").then(({ getLatestSkillGapRequest }) => {
      getLatestSkillGapRequest()
        .then((res) => {
          if (res) {
            setResult(res);
            setTargetRole(res.report.targetRole);
          }
        })
        .catch((err) => console.error("Failed to load skill gap:", err))
        .finally(() => setInitialLoad(false));
    });
  }, []);

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
        <main className="flex-1 p-6 space-y-6 bg-background">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-navy">Skill Gap Analysis</h1>
            <p className="text-sm text-text-muted mt-1">
              Select your dream role. Our AI will compare your current verified resume skills against industry requirements to pinpoint exactly what you need to learn.
            </p>
          </div>

          <div className="max-w-2xl">
            <Card title="Target Configuration" tone="blue">
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Select Your Target Role</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy outline-none shadow-sm font-medium text-navy"
                  >
                    {KNOWN_ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn-primary text-sm px-6 py-2.5"
                >
                  {loading ? "Analyzing..." : "Analyze"}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-4 border border-red-200 bg-red-50 rounded-lg p-3 font-medium">
                  {error}
                  {error.toLowerCase().includes("resume") && (
                    <Link href="/dashboard/student/resume" className="underline ml-1">
                      Upload one here.
                    </Link>
                  )}
                </p>
              )}
            </Card>
          </div>

          {initialLoad && !result && (
            <p className="text-sm text-text-muted animate-pulse">Loading your latest analysis...</p>
          )}

          {!initialLoad && !result && !error && (
            <div className="max-w-2xl border-2 border-dashed border-gray-300 rounded-xl p-10 text-center bg-gray-50">
              <div className="text-4xl mb-3">??</div>
              <h3 className="text-lg font-bold text-navy mb-1">Ready to find your gaps?</h3>
              <p className="text-sm text-gray-500">Select a target role above and click Analyze to generate your custom skill report.</p>
            </div>
          )}

          {result && (
            <div className="max-w-5xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Verified Skills */}
                <Card title="Your Verified Skills" tone="green">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.currentSkills.length === 0 && (
                      <span className="text-gray-500 text-sm italic">No skills detected. Try updating your resume.</span>
                    )}
                    {result.currentSkills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-md bg-green-50 border border-green-200 text-xs font-bold text-green-800 shadow-sm">
                        ? {skill}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Missing Skills */}
                <Card title="Missing Skills to Learn" tone="gold">
                  <div className="flex flex-wrap gap-2 mt-2">
                    {result.report.missingSkills.length === 0 && (
                      <span className="text-green-700 font-bold text-sm bg-green-50 p-3 rounded-lg border border-green-200 w-full text-center">
                        ?? Perfect Match! Your resume indicates you have all the required skills for {result.report.targetRole}.
                      </span>
                    )}
                    {result.report.missingSkills.map((skill) => (
                      <span key={skill} className="px-3 py-1.5 rounded-md bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900 shadow-sm">
                        + {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Actionable Roadmap */}
              <Card title="Recommended Learning Roadmap" tone="blue">
                {(() => {
                  const milestones = result.report.roadmap?.milestones;
                  if (!milestones || (Array.isArray(milestones) && milestones.length === 0)) {
                    return <p className="text-sm text-gray-500 italic">No roadmap generated.</p>;
                  }
                  
                  if (Array.isArray(milestones)) {
                    return (
                      <div className="space-y-4 mt-2">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {milestones.slice(0, 3).map((m: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm flex flex-col">
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-500 mb-1">Step {m.step}</span>
                              <span className="font-bold text-navy mb-2">{m.title}</span>
                              <span className="text-xs text-gray-500 flex-1">{m.description}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
                          <span className="text-sm font-medium text-gray-700">
                            {milestones.length > 3 ? `+${milestones.length - 3} more steps in your personalized plan.` : "Ready to start your journey?"}
                          </span>
                          <Link
                            href="/dashboard/student/roadmap"
                            className="btn-primary text-sm px-5 py-2 shadow-sm"
                          >
                            Open Full Interactive Roadmap
                          </Link>
                        </div>
                      </div>
                    );
                  }
                  return <p className="text-sm text-gray-800 bg-gray-50 p-4 rounded-lg border">{typeof milestones === "object" && "text" in milestones ? (milestones as any).text : String(milestones)}</p>;
                })()}
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/skill-gap/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_ui)

"use client";

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

  // Handle both legacy string array and new rich JSON object in missingSkills
  const advanced = (result?.report.missingSkills && !Array.isArray(result?.report.missingSkills)) 
    ? result.report.missingSkills 
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-6xl mx-auto">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-navy">Skill Gap Analysis</h1>
                <p className="text-sm text-gray-500 mt-1 max-w-2xl">
                  Select a target role. CareerOS will compare your resume against industry standards, identify gaps, and generate a customized learning roadmap.
                </p>
              </div>
              <div className="flex gap-2 w-full md:w-auto bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="flex-1 md:w-64 border-none bg-transparent px-3 py-2 text-sm font-bold text-navy focus:ring-0 outline-none"
                >
                  {KNOWN_ROLES.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="btn-primary text-sm px-6 py-2 shadow-sm rounded-lg"
                >
                  {loading ? "Analyzing..." : "Analyze Role"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl mb-6 shadow-sm">
                <p className="text-sm text-red-700 font-bold">{error}</p>
                {error.toLowerCase().includes("resume") && (
                  <Link href="/dashboard/student/resume" className="text-red-700 underline text-xs mt-1 block">
                    Upload your resume first
                  </Link>
                )}
              </div>
            )}

            {result?.isStale && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-amber-800 font-bold">Analysis Outdated</p>
                  <p className="text-xs text-amber-700 mt-0.5">{result.staleReason || "Your resume or target role has updated since this analysis was generated."}</p>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="text-xs bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-lg shadow-sm whitespace-nowrap self-start sm:self-auto"
                >
                  Re-analyze Now
                </button>
              </div>
            )}

            {initialLoad && !result && (
              <div className="flex justify-center items-center h-40">
                <p className="text-sm text-gray-400 font-bold animate-pulse tracking-widest uppercase">Fetching Data...</p>
              </div>
            )}

            {!initialLoad && !result && !error && (
              <div className="bg-white border border-gray-200 rounded-3xl p-16 text-center shadow-sm">
                <div className="text-6xl mb-4 opacity-50">??</div>
                <h3 className="text-xl font-black text-navy mb-2">No Analysis Available</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto">Choose a target role from the dropdown above and click Analyze to discover your personalized career path.</p>
              </div>
            )}

            {result && (
              advanced ? (
                // --- ADVANCED UI ---
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Top Metrics Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Readiness Score */}
                    <Card title="Job Readiness Score" tone="gold" className="md:col-span-1">
                      <div className="flex flex-col items-center justify-center py-6 h-full">
                        <div className="relative flex items-center justify-center mb-4">
                          <svg className="w-32 h-32 transform -rotate-90">
                            <circle cx="64" cy="64" r="56" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                            <circle 
                              cx="64" cy="64" r="56" fill="none" 
                              stroke={advanced.readinessScore >= 80 ? "#22c55e" : advanced.readinessScore >= 50 ? "#f59e0b" : "#ef4444"} 
                              strokeWidth="12" 
                              strokeDasharray="351.86"
                              strokeDashoffset={351.86 - (351.86 * advanced.readinessScore) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute text-3xl font-black text-navy">{advanced.readinessScore}%</div>
                        </div>
                        <p className="text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                          {advanced.readinessScore >= 80 ? 'Strong Candidate' : advanced.readinessScore >= 50 ? 'Moderate Foundation' : 'Requires Preparation'}
                        </p>
                      </div>
                    </Card>

                    {/* Skill Categories */}
                    <Card title="Skill Coverage" tone="blue" className="md:col-span-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 mt-2">
                        {advanced.categories?.map((cat: any, idx: number) => (
                          <div key={idx}>
                            <div className="flex justify-between items-end mb-1.5">
                              <span className="text-sm font-bold text-gray-700">{cat.name}</span>
                              <span className="text-xs font-bold text-navy">{cat.matched}/{cat.required}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${cat.percentage === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.max(cat.percentage, 5)}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        {(!advanced.categories || advanced.categories.length === 0) && (
                          <p className="text-xs text-gray-400 italic">Coverage details unavailable.</p>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Career Insight */}
                  {advanced.insight && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
                      <div className="flex gap-4 items-start">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                          ??
                        </div>
                        <div>
                          <h3 className="font-black text-blue-900 text-sm mb-1 uppercase tracking-wide">CareerOS Insight</h3>
                          <p className="text-blue-800 text-sm leading-relaxed">{advanced.insight}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Possessed Skills */}
                    <Card title="Detected Skills" tone="green">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Core & Relevant</h4>
                          <div className="flex flex-wrap gap-2">
                            {advanced.matchedSkills?.map((s: string) => (
                              <span key={s} className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 text-xs font-bold rounded-lg shadow-sm">
                                ? {s}
                              </span>
                            ))}
                            {(!advanced.matchedSkills || advanced.matchedSkills.length === 0) && <span className="text-xs text-gray-400">None detected.</span>}
                          </div>
                        </div>
                        {advanced.transferableSkills && advanced.transferableSkills.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Transferable</h4>
                            <div className="flex flex-wrap gap-2">
                              {advanced.transferableSkills.map((s: string) => (
                                <span key={s} className="px-2.5 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-bold rounded-lg">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Missing Skills (Priority) */}
                    <Card title="Priority Learning Areas" tone="gold">
                      <div className="space-y-3 mt-1">
                        {advanced.missingSkills?.length === 0 ? (
                          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                            <span className="text-2xl mb-2 block">??</span>
                            <span className="text-green-800 font-bold block">100% Core Match!</span>
                            <span className="text-green-600 text-xs">You have all the required skills for this role.</span>
                          </div>
                        ) : (
                          advanced.missingSkills?.map((skill: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl hover:border-amber-300 transition-colors shadow-sm">
                              <div>
                                <span className="font-bold text-navy block text-sm">{skill.name}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{skill.category}</span>
                              </div>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                                skill.priority === 'critical' ? 'bg-red-100 text-red-700' : 
                                skill.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                              }`}>
                                {skill.priority}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* Vertical Roadmap */}
                  {advanced.roadmap && advanced.roadmap.length > 0 && (
                    <Card title="Interactive Learning Roadmap" tone="blue">
                      <div className="mt-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-200 before:to-transparent">
                        {advanced.roadmap.map((m: any, idx: number) => (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active mb-8">
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-500 text-white font-black text-xs shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                              0{m.step}
                            </div>
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-2xl border border-gray-200 shadow-sm group-hover:border-blue-400 group-hover:shadow-md transition-all">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-navy">{m.title}</h4>
                                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider whitespace-nowrap ml-2">
                                  ~{m.estimatedWeeks}w
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mb-4 leading-relaxed">{m.description}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {m.skills?.map((s: string) => (
                                  <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">
                                    {s}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex justify-center mt-6">
                        <Link href="/dashboard/student/roadmap" className="btn-primary text-sm px-8 py-2.5 shadow-md">
                          Open Interactive Roadmap Tracker
                        </Link>
                      </div>
                    </Card>
                  )}
                  
                </div>
              ) : (
                // --- LEGACY UI (Fallback) ---
                <div className="space-y-6">
                  <Card title={`Skills Detected vs Target (${result.report.targetRole})`} tone="gold">
                    <div className="mb-4">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Your Verified Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {result.currentSkills.map((skill) => (
                          <span key={skill} className="px-2.5 py-1 rounded-md bg-green-50 border border-green-200 text-xs font-bold text-green-800">
                            ? {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Missing Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {(result.report.missingSkills as string[]).map((skill) => (
                          <span key={skill} className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                            + {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Card>
                  
                  <div className="flex justify-center">
                    <Link href="/dashboard/student/roadmap" className="btn-primary text-sm px-6 py-2">
                      View Roadmap
                    </Link>
                  </div>
                </div>
              )
            )}
            
          </div>
        </main>
      </div>
    </div>
  );
}

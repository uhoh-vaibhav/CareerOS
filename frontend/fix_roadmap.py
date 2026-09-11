with open("src/app/dashboard/student/roadmap/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_ui = """"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getRoadmapRequest, updateRoadmapProgressRequest, RoadmapResult, RoadmapMilestone } from "@/lib/api";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For expanding cards
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  useEffect(() => {
    getRoadmapRequest()
      .then((res) => {
        if (res) {
          setRoadmap(res);
          const initial = new Set<number>();
          if (Array.isArray(res.milestones)) {
            res.milestones.forEach((m: any, i) => {
              if (m.isCompleted) initial.add(i);
            });
          }
          setCompletedSteps(initial);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const milestones = (roadmap?.milestones ?? []) as RoadmapMilestone[];
  const totalWeeks = milestones.reduce((s, m) => s + (m.estimatedWeeks ?? 0), 0);
  
  // Calculate remaining weeks
  const remainingWeeks = milestones.reduce((s, m, i) => {
    return completedSteps.has(i) ? s : s + (m.estimatedWeeks ?? 0);
  }, 0);

  async function toggleStep(idx: number) {
    const nextSteps = new Set(completedSteps);
    if (nextSteps.has(idx)) nextSteps.delete(idx);
    else nextSteps.add(idx);
    
    const nextArr = Array.from(nextSteps);
    const newPct = milestones.length > 0 ? Math.round((nextArr.length / milestones.length) * 100) : 0;
    
    setCompletedSteps(nextSteps);

    if (roadmap) {
      setSaving(true);
      try {
        await updateRoadmapProgressRequest(roadmap.id, newPct, nextArr);
        setRoadmap(prev => prev ? { ...prev, progressPct: newPct } : prev);
      } catch (err) {
        console.error("Failed to save progress", err);
        setCompletedSteps(prev => {
          const reverted = new Set(prev);
          if (reverted.has(idx)) reverted.delete(idx);
          else reverted.add(idx);
          return reverted;
        });
      } finally {
        setSaving(false);
      }
    }
  }

  function toggleExpand(idx: number) {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  const progressPct = roadmap?.progressPct ?? 0;
  const is100Pct = progressPct === 100;

  // Determine current focus (first incomplete step)
  const currentStepIdx = milestones.findIndex((_, i) => !completedSteps.has(i));
  const currentStep = currentStepIdx !== -1 ? milestones[currentStepIdx] : null;

  // Handle rich JSON missingSkills or legacy missingSkills
  const rawMissing = roadmap?.missingSkills as any;
  let missingSkillsList: string[] = [];
  if (Array.isArray(rawMissing)) {
    if (rawMissing.length > 0 && typeof rawMissing[0] === 'string') {
      missingSkillsList = rawMissing;
    }
  } else if (rawMissing?.missingSkills) {
    missingSkillsList = rawMissing.missingSkills.map((s: any) => typeof s === 'string' ? s : s.name);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="max-w-6xl mx-auto">
            
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-bold text-navy">Learning Roadmap</h1>
                {roadmap && <p className="text-sm text-gray-500 mt-1">Preparing for: <span className="font-bold text-blue-600">{roadmap.targetRole}</span></p>}
              </div>
            </div>

            {loading && (
              <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-4">
                  <div className="h-32 bg-white rounded-2xl animate-pulse border border-gray-200"></div>
                  <div className="h-48 bg-white rounded-2xl animate-pulse border border-gray-200"></div>
                </div>
                <div className="w-full lg:w-80 h-96 bg-white rounded-2xl animate-pulse border border-gray-200"></div>
              </div>
            )}
            
            {error && <p className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

            {!loading && !roadmap && !error && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center shadow-sm">
                <div className="text-6xl mb-4 opacity-50">???</div>
                <h3 className="text-xl font-black text-navy mb-2">No Learning Roadmap Yet</h3>
                <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
                  Complete a Skill Gap Analysis to generate a personalized roadmap for your target role.
                </p>
                <Link href="/dashboard/student/skill-gap" className="btn-primary px-8 py-2.5 shadow-md">
                  Analyze My Skills
                </Link>
              </div>
            )}

            {roadmap && (
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Main Timeline (Left) */}
                <div className="flex-1 space-y-6">
                  
                  {is100Pct ? (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">
                          ??
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-green-900 mb-1">Roadmap Complete!</h3>
                          <p className="text-green-800 text-sm mb-4">
                            You've completed all learning steps in this roadmap.
                          </p>
                          <div className="bg-white/60 p-4 rounded-xl border border-green-200/50">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Next Recommended Action</p>
                            <p className="text-sm text-gray-700 mb-4">
                              Update your resume with the projects and skills you've genuinely gained, then run the Skill Gap Analysis again to re-verify your progress.
                            </p>
                            <div className="flex gap-3">
                              <Link href="/dashboard/student/resume" className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors">
                                Update Resume
                              </Link>
                              <Link href="/dashboard/student/skill-gap" className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition-colors">
                                Re-run Skill Analysis
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  <div className="relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-gray-200 before:to-transparent">
                    {milestones.map((m, idx) => {
                      const done = completedSteps.has(idx);
                      const isCurrent = currentStepIdx === idx;
                      const isExpanded = expandedCards.has(idx);
                      
                      return (
                        <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group mb-8">
                          
                          {/* Timeline Node */}
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white font-black text-xs shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${
                            done ? "bg-green-500 text-white" : isCurrent ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-500"
                          }`}>
                            {done ? "?" : `0${m.step}`}
                          </div>

                          {/* Card */}
                          <div className={`w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-5 rounded-2xl border shadow-sm transition-all ${
                            done ? "bg-green-50/50 border-green-200" : isCurrent ? "bg-white border-blue-400 shadow-md" : "bg-white border-gray-200 opacity-75 hover:opacity-100"
                          }`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  {done ? (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-green-700 bg-green-100 px-2 py-0.5 rounded">Completed</span>
                                  ) : isCurrent ? (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span> In Progress
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-0.5 rounded">Upcoming</span>
                                  )}
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                    ~{m.estimatedWeeks} weeks
                                  </span>
                                </div>
                                <h3 className={`font-bold text-lg ${done ? "text-gray-500 line-through" : "text-navy"}`}>
                                  {m.title}
                                </h3>
                              </div>
                              <button
                                onClick={() => toggleStep(idx)}
                                disabled={saving}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                  done
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "border-gray-300 hover:border-blue-500 bg-white"
                                }`}
                              >
                                {done && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </button>
                            </div>

                            <p className="text-sm text-gray-600 mt-2 mb-3 leading-relaxed">{m.description}</p>
                            
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {m.skills?.map((s) => (
                                <span key={s} className="px-2 py-1 bg-white border border-gray-200 text-gray-600 text-[10px] font-bold rounded shadow-sm">
                                  {s}
                                </span>
                              ))}
                            </div>

                            {/* Expandable Section */}
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`}>
                              {m.resources?.length > 0 && (
                                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Learning Resources</p>
                                  <ul className="text-xs text-gray-700 space-y-2">
                                    {m.resources.map((r, i) => (
                                      <li key={i} className="flex gap-2 items-start">
                                        <span className="text-blue-500 mt-0.5">??</span>
                                        <span className="font-medium">{r}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => toggleExpand(idx)}
                              className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors mt-2 flex items-center gap-1"
                            >
                              {isExpanded ? "Hide Details" : "View Details"}
                              <svg className={`w-3 h-3 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-full lg:w-80 space-y-6 shrink-0">
                  
                  <Card title="Your Progress" tone="blue">
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-3xl font-black text-navy">{progressPct}%</span>
                      <span className="text-xs font-bold text-gray-500">{completedSteps.size} / {milestones.length} done</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner mb-4">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 bg-blue-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 font-medium">
                      <span>Total: ~{totalWeeks}w</span>
                      <span>Remaining: ~{remainingWeeks}w</span>
                    </div>
                    {saving && <p className="text-[10px] font-bold text-blue-600 animate-pulse text-center mt-3">Syncing progress...</p>}
                  </Card>

                  {currentStep && !is100Pct && (
                    <Card title="Current Focus" tone="green">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                        <span className="text-[10px] font-black uppercase tracking-wider text-green-700 block mb-1">Step {currentStep.step}</span>
                        <h4 className="font-bold text-green-900 leading-tight mb-2">{currentStep.title}</h4>
                        <div className="flex flex-wrap gap-1">
                          {currentStep.skills?.slice(0,3).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-white border border-green-100 text-[10px] font-bold text-green-700 rounded shadow-sm">{s}</span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  )}

                  {missingSkillsList.length > 0 && (
                    <Card title="Skills Remaining" tone="gold">
                      <div className="flex flex-wrap gap-1.5">
                        {missingSkillsList.map(skill => (
                          <span key={skill} className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold rounded shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </Card>
                  )}

                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/roadmap/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_ui)

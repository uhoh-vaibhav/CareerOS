"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { getRoadmapRequest, updateRoadmapProgressRequest, RoadmapResult, generateStudyMaterialRequest } from "@/lib/api";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  
  // Study Mode State
  const [activeStudy, setActiveStudy] = useState<{pIdx: number, stIdx: number} | null>(null);
  const [studyMaterials, setStudyMaterials] = useState<Record<string, any>>({});
  const [studyLoading, setStudyLoading] = useState<string | null>(null);

  async function openStudyMode(pIdx: number, stIdx: number, forceRegenerate = false) {
    const key = `${pIdx}-${stIdx}`;
    setActiveStudy({ pIdx, stIdx });
    
    if (studyMaterials[key] && !forceRegenerate) return;
    
    if (!roadmap) return;
    setStudyLoading(key);
    try {
      const material = await generateStudyMaterialRequest(roadmap.id, pIdx, stIdx, forceRegenerate);
      setStudyMaterials(prev => ({ ...prev, [key]: material }));
    } catch (e) {
      console.error(e);
      // Optional: show error toast here
    } finally {
      setStudyLoading(null);
    }
  }


  useEffect(() => {
    getRoadmapRequest()
      .then((res) => {
        if (res) {
          setRoadmap(res);
          const initial = new Set<string>();
          if (Array.isArray(res.milestones)) {
            res.milestones.forEach((p: any, pIdx) => {
              if (p.isCompleted) initial.add(String(pIdx));
              if (Array.isArray(p.subtasks)) {
                p.subtasks.forEach((st: any, stIdx: number) => {
                  if (st.isCompleted) initial.add(`${pIdx}-${stIdx}`);
                });
              }
            });
          }
          setCompletedSteps(initial);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const phases = (roadmap?.milestones ?? []) as any[];

  // Statistics
  const totalPhases = phases.length;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  
  phases.forEach((p, pIdx) => {
    if (Array.isArray(p.subtasks) && p.subtasks.length > 0) {
      totalSubtasks += p.subtasks.length;
      p.subtasks.forEach((st: any, stIdx: number) => {
        if (completedSteps.has(`${pIdx}-${stIdx}`)) completedSubtasks++;
      });
    } else {
      // Legacy fallback (no subtasks, phase is the task)
      totalSubtasks += 1;
      if (completedSteps.has(String(pIdx))) completedSubtasks++;
    }
  });

  const remainingSubtasks = totalSubtasks - completedSubtasks;
  const progressPct = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;
  const is100Pct = progressPct === 100;

  async function toggleStep(id: string) {
    const nextSteps = new Set(completedSteps);
    if (nextSteps.has(id)) nextSteps.delete(id);
    else nextSteps.add(id);
    
    const nextArr = Array.from(nextSteps);
    const newPct = totalSubtasks > 0 ? Math.round((nextArr.length / totalSubtasks) * 100) : 0;
    
    setCompletedSteps(nextSteps);

    if (roadmap) {
      setSaving(true);
      try {
        await updateRoadmapProgressRequest(roadmap.id, newPct, nextArr as any);
        setRoadmap(prev => prev ? { ...prev, progressPct: newPct } : prev);
      } catch (err) {
        console.error("Failed to save progress", err);
        setCompletedSteps(prev => {
          const reverted = new Set(prev);
          if (reverted.has(id)) reverted.delete(id);
          else reverted.add(id);
          return reverted;
        });
      } finally {
        setSaving(false);
      }
    }
  }

  function togglePhase(idx: number) {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  // Determine current focus
  let currentPhaseObj: any = null;
  let currentSubtaskObj: any = null;
  let cPIdx = -1;
  let cStIdx = -1;
  
  for (let pIdx = 0; pIdx < phases.length; pIdx++) {
    const p = phases[pIdx];
    if (Array.isArray(p.subtasks) && p.subtasks.length > 0) {
      for (let stIdx = 0; stIdx < p.subtasks.length; stIdx++) {
        if (!completedSteps.has(`${pIdx}-${stIdx}`)) {
          currentPhaseObj = p;
          currentSubtaskObj = p.subtasks[stIdx];
          cPIdx = pIdx;
          cStIdx = stIdx;
          break;
        }
      }
    } else {
      if (!completedSteps.has(String(pIdx))) {
        currentPhaseObj = p;
        cPIdx = pIdx;
        break;
      }
    }
    if (currentPhaseObj) break;
  }

  function scrollToCurrent() {
    if (cPIdx !== -1) {
      // expand if collapsed
      if (!expandedPhases.has(cPIdx)) {
        setExpandedPhases(prev => {
          const next = new Set(prev);
          next.add(cPIdx);
          return next;
        });
      }
      setTimeout(() => {
        const el = document.getElementById(`subtask-${cPIdx}-${cStIdx !== -1 ? cStIdx : 'legacy'}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-4', 'ring-blue-200');
          setTimeout(() => el.classList.remove('ring-4', 'ring-blue-200'), 2000);
        }
      }, 100);
    }
  }

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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          <div className="max-w-7xl mx-auto">
            
            <div className="mb-6">
              <h1 className="text-3xl font-black text-navy tracking-tight">Learning Roadmap</h1>
              {roadmap && <p className="text-sm font-medium text-gray-500 mt-1">Preparing for: <span className="font-bold text-blue-600">{roadmap.targetRole}</span></p>}
            </div>

            {loading && (
              <div className="flex flex-col gap-6 lg:flex-row animate-pulse">
                <div className="flex-1 space-y-4">
                  <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
                  <div className="h-64 bg-white rounded-2xl border border-gray-200"></div>
                </div>
                <div className="w-full lg:w-80 h-96 bg-white rounded-2xl border border-gray-200"></div>
              </div>
            )}
            
            {error && <p className="text-red-600 text-sm bg-red-50 p-4 rounded-xl border border-red-200">{error}</p>}

            {!loading && !roadmap && !error && (
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-3xl p-16 text-center shadow-sm">
                <div className="text-6xl mb-4 opacity-50">🗺️</div>
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
                        <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl shadow-inner shrink-0">🏆</div>
                        <div>
                          <h3 className="text-lg font-black text-green-900 mb-1">Roadmap Complete!</h3>
                          <p className="text-green-800 text-sm mb-4">You've completed all learning steps in this roadmap.</p>
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

                  <div className="space-y-6">
                    {phases.map((p, pIdx) => {
                      // Calculate phase completion
                      const hasSubtasks = Array.isArray(p.subtasks) && p.subtasks.length > 0;
                      let pTotal = hasSubtasks ? p.subtasks.length : 1;
                      let pCompleted = 0;
                      
                      if (hasSubtasks) {
                        p.subtasks.forEach((_: any, i: number) => {
                          if (completedSteps.has(`${pIdx}-${i}`)) pCompleted++;
                        });
                      } else {
                        if (completedSteps.has(String(pIdx))) pCompleted++;
                      }
                      
                      const pProgress = Math.round((pCompleted / pTotal) * 100);
                      const pDone = pProgress === 100;
                      const pCurrent = cPIdx === pIdx;
                      
                      // Auto-expand current phase
                      const isExpanded = expandedPhases.has(pIdx) || (pCurrent && !expandedPhases.has(-pIdx));

                      return (
                        <div key={pIdx} className={`bg-white rounded-2xl border transition-all shadow-sm overflow-hidden ${pDone ? 'border-gray-200 bg-gray-50' : pCurrent ? 'border-blue-300 ring-4 ring-blue-50' : 'border-gray-200'}`}>
                          
                          {/* Phase Header */}
                          <div 
                            className="p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => togglePhase(pIdx)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner shrink-0 ${pDone ? 'bg-green-100 text-green-700' : pCurrent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {pDone ? '✓' : pIdx + 1}
                              </div>
                              <div>
                                <h3 className={`text-lg font-bold ${pDone ? 'text-gray-500' : 'text-navy'}`}>Phase {pIdx + 1}: {p.title}</h3>
                                <div className="flex items-center gap-3 mt-1 text-xs">
                                  <span className="font-bold text-gray-500">~{p.estimatedWeeks} weeks</span>
                                  <span className="text-gray-300">-</span>
                                  <span className={`font-bold ${pDone ? 'text-green-600' : 'text-blue-600'}`}>{pCompleted} / {pTotal} milestones completed</span>
                                </div>
                              </div>
                            </div>
                            <svg className={`w-5 h-5 text-gray-400 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </div>

                          {/* Phase Progress Bar */}
                          <div className="w-full bg-gray-100 h-1.5">
                            <div className={`h-full transition-all ${pDone ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pProgress}%` }}></div>
                          </div>

                          {/* Subtasks (Milestones) */}
                          {isExpanded && (
                            <div className="p-5 bg-white border-t border-gray-100 space-y-4">
                              <p className="text-sm text-gray-600 mb-4">{p.description}</p>
                              
                              {hasSubtasks ? (
                                p.subtasks.map((st: any, stIdx: number) => {
                                  const stId = `${pIdx}-${stIdx}`;
                                  const stDone = completedSteps.has(stId);
                                  const stCurrent = cPIdx === pIdx && cStIdx === stIdx;
                                  
                                  return (
                                    <div id={`subtask-${stId}`} key={stIdx} className={`flex items-start gap-4 p-4 rounded-xl border transition-all duration-500 ${stDone ? 'bg-green-50/30 border-green-100' : stCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                      <button
                                        onClick={() => toggleStep(stId)}
                                        disabled={saving}
                                        className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${stDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white hover:border-blue-500'}`}
                                      >
                                        {stDone && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                      </button>
                                      
                                      <div className="flex-1">
                                        <div className="flex justify-between items-start mb-1">
                                          <h4 className={`text-sm font-bold ${stDone ? 'text-gray-500' : 'text-navy'}`}>{st.title}</h4>
                                          {stDone && <span className="text-[10px] font-black uppercase tracking-widest text-green-700 bg-green-100 px-2 py-0.5 rounded ml-2">Completed</span>}
                                          {stCurrent && <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-blue-100 px-2 py-0.5 rounded ml-2 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>Current</span>}
                                        </div>
                                        
                                        <p className="text-xs text-gray-500 leading-relaxed mb-3">{st.description}</p>
                                        
                                        <div className="flex flex-wrap items-center gap-3">
                                          {st.estimatedTime && (
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                              TIME: {st.estimatedTime}
                                            </span>
                                          )}
                                          {st.skills?.map((s: string) => (
                                            <span key={s} className="text-[10px] font-bold text-gray-600 border border-gray-200 px-2 py-1 rounded">
                                              {s}
                                            </span>
                                          ))}
                                        </div>
                                        
                                        {/* Action Bar */}
                                        <div className="mt-4 pt-4 border-t border-gray-100/60 flex flex-wrap gap-2">
                                          <button 
                                            onClick={() => openStudyMode(pIdx, stIdx)}
                                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-sm bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                          >
                                            Generate Notes
                                          </button>
                                          
                                          <Link 
                                            href={`/dashboard/student/mentor?ask=Help me understand ${encodeURIComponent(st.title)} from Phase ${pIdx + 1} of my Roadmap.`}
                                            className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-sm bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 flex items-center gap-1.5"
                                          >
                                            Ask AI Mentor
                                          </Link>
                                          
                                          {st.resources?.length > 0 && (
                                            <div className="flex gap-2">
                                              {st.resources.map((r: string, rIdx: number) => (
                                                <a key={rIdx} href={r.startsWith('http') ? r : `https://google.com/search?q=${encodeURIComponent(r)}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all shadow-sm bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200">
                                                  {r.length > 20 ? 'Official Docs' : r}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        {/* Study Mode View */}
                                        {activeStudy?.pIdx === pIdx && activeStudy?.stIdx === stIdx && (
                                          <div className="mt-4 bg-gray-50 rounded-xl border border-gray-200 p-5 shadow-inner">
                                            <div className="flex justify-between items-center mb-4">
                                              <h5 className="font-black text-navy text-sm flex items-center gap-2">
                                                <span className="text-blue-500">📚</span> CareerOS Study Notes
                                              </h5>
                                              <div className="flex items-center gap-2">
                                                <button onClick={() => openStudyMode(pIdx, stIdx, true)} className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-blue-600 transition-colors">
                                                  Regenerate
                                                </button>
                                                <button onClick={() => setActiveStudy(null)} className="text-gray-400 hover:text-gray-600">
                                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                              </div>
                                            </div>
                                            
                                            {studyLoading === `${pIdx}-${stIdx}` ? (
                                              <div className="py-8 flex flex-col items-center justify-center space-y-3 opacity-50">
                                                <span className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></span>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Generating Material...</p>
                                              </div>
                                            ) : studyMaterials[`${pIdx}-${stIdx}`] ? (
                                              <div className="space-y-4">
                                                <p className="text-xs text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100">{studyMaterials[`${pIdx}-${stIdx}`].overview}</p>
                                                
                                                {studyMaterials[`${pIdx}-${stIdx}`].concepts?.map((c: any, i: number) => (
                                                  <div key={i} className="bg-white p-3 rounded-lg border border-gray-100">
                                                    <h6 className="text-[10px] font-black uppercase text-blue-800 mb-1">{c.title}</h6>
                                                    <p className="text-xs text-gray-600">{c.explanation}</p>
                                                  </div>
                                                ))}
                                                
                                                {studyMaterials[`${pIdx}-${stIdx}`].example && (
                                                  <div className="bg-gray-900 rounded-lg p-3 overflow-x-auto">
                                                    <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Example</p>
                                                    <pre className="text-xs text-green-400 font-mono"><code>{studyMaterials[`${pIdx}-${stIdx}`].example}</code></pre>
                                                  </div>
                                                )}
                                                
                                                {studyMaterials[`${pIdx}-${stIdx}`].practiceTask && (
                                                  <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                    <h6 className="text-[10px] font-black uppercase text-amber-800 mb-1">Practice Task</h6>
                                                    <p className="text-xs text-amber-900">{studyMaterials[`${pIdx}-${stIdx}`].practiceTask}</p>
                                                  </div>
                                                )}
                                                
                                                <p className="text-[9px] text-gray-400 italic mt-2 text-center">AI-generated learning material may contain mistakes. Verify technical details with official documentation when needed.</p>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-red-500 text-center py-4">Failed to load study notes.</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                /* Legacy Phase Support (No subtasks) */
                                <div id={`subtask-${pIdx}-legacy`} className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${pDone ? 'bg-green-50/30 border-green-100' : pCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                                  <button
                                    onClick={() => toggleStep(String(pIdx))}
                                    disabled={saving}
                                    className={`mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${pDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 bg-white hover:border-blue-500'}`}
                                  >
                                    {pDone && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </button>
                                  <div className="flex-1">
                                    <h4 className={`text-sm font-bold ${pDone ? 'text-gray-500' : 'text-navy'}`}>Complete Phase {pIdx + 1} Requirements</h4>
                                    <p className="text-xs text-gray-500 leading-relaxed mt-1">This is a legacy roadmap step. Check the box when you've mastered the concepts in this phase.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sidebar (Right) */}
                <div className="w-full lg:w-80 space-y-6 shrink-0">
                  
                  {/* Summary Metrics */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                    <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Roadmap Summary</h2>
                    
                    <div className="flex justify-between items-end mb-2">
                      <span className="text-3xl font-black text-navy">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden shadow-inner mb-6">
                      <div className="h-full rounded-full transition-all duration-1000 bg-blue-500" style={{ width: `${progressPct}%` }} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="block text-2xl font-black text-navy">{totalPhases}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Phases</span>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <span className="block text-2xl font-black text-navy">{totalSubtasks}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Milestones</span>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                        <span className="block text-2xl font-black text-green-700">{completedSubtasks}</span>
                        <span className="text-[10px] font-bold text-green-600 uppercase">Completed</span>
                      </div>
                      <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                        <span className="block text-2xl font-black text-amber-700">{remainingSubtasks}</span>
                        <span className="text-[10px] font-bold text-amber-600 uppercase">Remaining</span>
                      </div>
                    </div>
                    {saving && <p className="text-[10px] font-bold text-blue-600 animate-pulse text-center mt-4">Syncing progress...</p>}
                  </div>

                  {/* Current Focus */}
                  {currentPhaseObj && !is100Pct && (
                    <div className="bg-gradient-to-br from-blue-600 to-navy rounded-3xl p-6 shadow-md text-white">
                      <h2 className="font-bold text-blue-200 uppercase tracking-widest text-xs mb-4">Current Focus</h2>
                      <div className="space-y-1 mb-4">
                        <span className="text-[10px] font-black uppercase text-blue-300 block">Phase {cPIdx + 1} of {totalPhases}</span>
                        <h4 className="font-bold text-white leading-tight">{currentPhaseObj.title}</h4>
                      </div>
                      
                      {currentSubtaskObj ? (
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-4">
                          <span className="text-[10px] font-black uppercase text-blue-200 block mb-1">Milestone {cStIdx + 1}</span>
                          <h5 className="font-bold text-sm text-white">{currentSubtaskObj.title}</h5>
                          {currentSubtaskObj.estimatedTime && <span className="text-[10px] text-blue-200 mt-2 block">TIME: {currentSubtaskObj.estimatedTime}</span>}
                        </div>
                      ) : (
                        <div className="bg-white/10 p-4 rounded-xl border border-white/20 mb-4">
                          <h5 className="font-bold text-sm text-white">Legacy Phase Requirement</h5>
                        </div>
                      )}
                      
                      <button onClick={scrollToCurrent} className="w-full bg-white text-navy font-bold text-xs py-3 rounded-xl shadow-sm hover:bg-blue-50 transition-colors">
                        Continue Roadmap
                      </button>
                    </div>
                  )}

                  {/* Skills Addressed */}
                  {missingSkillsList.length > 0 && (
                    <Card title="Skills Addressed" tone="gold">
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

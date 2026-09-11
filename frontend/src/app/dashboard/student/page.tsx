"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { 
  getReadinessScoreRequest, 
  computeReadinessScoreRequest, 
  getLatestSkillGapRequest, 
  getRoadmapRequest,
  getPortfolioRequest,
  getLatestResumeRequest,
  getReadinessHistoryRequest
} from "@/lib/api";

export default function OverviewPage() {
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  
  const [scoreData, setScoreData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [resume, setResume] = useState<any>(null);
  const [skillGap, setSkillGap] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [sc, hist, resu, sg, rd, pf] = await Promise.allSettled([
          getReadinessScoreRequest(),
          getReadinessHistoryRequest(),
          getLatestResumeRequest(),
          getLatestSkillGapRequest(),
          getRoadmapRequest(),
          getPortfolioRequest()
        ]);
        
        if (sc.status === "fulfilled") setScoreData(sc.value);
        if (hist.status === "fulfilled") setHistory(hist.value);
        if (resu.status === "fulfilled") setResume(resu.value);
        if (sg.status === "fulfilled") setSkillGap(sg.value);
        if (rd.status === "fulfilled") setRoadmap(rd.value);
        if (pf.status === "fulfilled") setPortfolio(pf.value);
      } catch (e) {
        console.error("Dashboard fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleRefresh() {
    setComputing(true);
    try {
      const newScore = await computeReadinessScoreRequest();
      setScoreData(newScore);
      const newHist = await getReadinessHistoryRequest();
      setHistory(newHist);
    } catch (e) {
      console.error(e);
    } finally {
      setComputing(false);
    }
  }

  // --- Derived State ---
  
  const targetRole = skillGap?.report?.targetRole || "Unknown Role";
  
  // Missing skills parsing (handling both legacy string array and new JSON array)
  let missingSkillsList: any[] = [];
  const rawMissing = skillGap?.report?.missingSkills;
  if (Array.isArray(rawMissing)) {
    if (rawMissing.length > 0 && typeof rawMissing[0] === 'string') {
      missingSkillsList = rawMissing.map(s => ({ name: s, priority: 'medium' }));
    } else {
      missingSkillsList = rawMissing;
    }
  } else if (rawMissing?.missingSkills) {
    missingSkillsList = rawMissing.missingSkills;
  }
  
  // Next Best Action Logic
  let nbaTitle = "Complete Your Profile";
  let nbaDesc = "Start by uploading your resume.";
  let nbaLink = "/dashboard/student/resume";
  let nbaButton = "Upload Resume";
  
  if (!resume) {
    // Keep defaults
  } else if (!skillGap) {
    nbaTitle = "Analyze Your Skills";
    nbaDesc = "Discover what you need to learn for your dream job.";
    nbaLink = "/dashboard/student/skill-gap";
    nbaButton = "Start Analysis";
  } else if (!roadmap) {
    nbaTitle = "Generate Learning Roadmap";
    nbaDesc = "Turn your skill gaps into an actionable plan.";
    nbaLink = "/dashboard/student/skill-gap";
    nbaButton = "View Skill Gap";
  } else if (!portfolio) {
    nbaTitle = "Link GitHub Portfolio";
    nbaDesc = "Showcase your real-world coding experience.";
    nbaLink = "/dashboard/student/portfolio";
    nbaButton = "Add Portfolio";
  } else {
    nbaTitle = "Practice Interviewing";
    nbaDesc = "Hone your verbal skills with AI-driven mock interviews.";
    nbaLink = "/dashboard/student/mock-interview";
    nbaButton = "Start Mock Interview";
  }

  // Assessed checks (backend defaults to 0, we want to show '-' if unassessed)
  const isAssessedResume = !!resume;
  const isAssessedSkill = !!skillGap;
  const isAssessedPortfolio = !!portfolio;
  // We don't fetch mock interview history yet, but we can guess from scoreData breakdown
  const isAssessedInterview = scoreData && scoreData.breakdown.interview > 0; // rough proxy

  // History trend
  const scoreDiff = history.length >= 2 
    ? (history[history.length - 1].compositeScore - history[history.length - 2].compositeScore)
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <TopNav role="Student" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar links={STUDENT_LINKS} />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          {/* Header */}
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-black text-navy mb-1 tracking-tight">Overview</h1>
            <p className="text-gray-500 font-medium">
              Track your progress toward becoming {targetRole === "Unknown Role" ? "job-ready" : `an ${targetRole}`}.
            </p>
          </div>

          {loading ? (
            <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
              <div className="flex gap-6">
                <div className="w-1/2 h-40 bg-white rounded-2xl border border-gray-200"></div>
                <div className="w-1/2 h-40 bg-white rounded-2xl border border-gray-200"></div>
              </div>
              <div className="h-24 bg-white rounded-2xl border border-gray-200"></div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* ROW 1: Hero Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Career Readiness */}
                <div className="bg-gradient-to-br from-navy to-blue-900 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-32 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                  
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    <div className="flex justify-between items-start mb-6">
                      <h2 className="font-bold text-blue-100 uppercase tracking-widest text-xs">Career Readiness</h2>
                      <button 
                        onClick={handleRefresh}
                        disabled={computing}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-xs font-bold transition-colors border border-white/10"
                      >
                        {computing ? (
                          <>
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                            Refreshing...
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            Refresh Readiness
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-baseline gap-4">
                      <span className="text-6xl font-black tracking-tighter">
                        {scoreData ? scoreData.compositeScore : "0"}
                      </span>
                      <span className="text-2xl text-blue-200/50 font-bold">/ 100</span>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold border border-white/10">
                        {scoreData ? (scoreData.compositeScore >= 80 ? "Strong Candidate" : scoreData.compositeScore >= 50 ? "Developing Profile" : "Needs Preparation") : "Not Assessed"}
                      </span>
                      {scoreDiff !== 0 && (
                        <span className={`text-xs font-bold ${scoreDiff > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {scoreDiff > 0 ? '+' : ''}{scoreDiff} since previous assessment
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Next Best Action */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner text-sm">🎯</span>
                      <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs">Your Next Best Action</h2>
                    </div>
                    <h3 className="text-2xl font-black text-navy mb-2">{nbaTitle}</h3>
                    <p className="text-sm text-gray-500">{nbaDesc}</p>
                  </div>
                  <div className="mt-6">
                    <Link href={nbaLink} className="inline-block bg-navy hover:bg-blue-800 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-md transition-all">
                      {nbaButton}
                    </Link>
                  </div>
                </div>
              </div>

              {/* ROW 2: Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard title="Resume ATS" score={isAssessedResume && scoreData ? scoreData.breakdown.ats : null} color="blue" />
                <MetricCard title="Skill Match" score={isAssessedSkill && scoreData ? scoreData.breakdown.skillGap : null} color="green" />
                <MetricCard title="Interview" score={isAssessedInterview && scoreData ? scoreData.breakdown.interview : null} color="purple" />
                <MetricCard title="Portfolio" score={isAssessedPortfolio && scoreData ? scoreData.breakdown.portfolio : null} color="amber" />
              </div>

              {/* ROW 3: Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Target Role & Gaps */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Target Role & Skill Gap</h2>
                  {skillGap ? (
                    <div>
                      <h3 className="text-xl font-bold text-navy mb-1">{targetRole}</h3>
                      <p className="text-sm font-bold text-amber-600 mb-4">{missingSkillsList.length} skills missing</p>
                      
                      <div className="space-y-2">
                        {missingSkillsList.slice(0, 3).map((skill: any, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-sm font-bold text-gray-700">{skill.name}</span>
                            {skill.priority && (
                              <span className="text-[10px] font-black uppercase text-gray-500">{skill.priority}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState text="Start Analysis" link="/dashboard/student/skill-gap" />
                  )}
                </div>

                {/* Roadmap Progress */}
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col">
                  <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Roadmap Progress</h2>
                  {roadmap ? (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-3xl font-black text-navy">{roadmap.progressPct}%</span>
                        <span className="text-xs font-bold text-gray-500 mb-1">Overall Completion</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-6">
                        <div className="bg-green-500 h-full rounded-full transition-all" style={{ width: `${roadmap.progressPct}%` }}></div>
                      </div>
                      
                      {(() => {
                        if (!Array.isArray(roadmap.milestones)) return null;
                        const currentIdx = roadmap.milestones.findIndex((m:any) => !m.isCompleted);
                        const current = currentIdx !== -1 ? roadmap.milestones[currentIdx] : null;
                        if (!current) return <p className="text-sm font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-200 text-center">Roadmap Complete! 🎉</p>;
                        
                        return (
                          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-1">Step {current.step} of {roadmap.milestones.length}</span>
                              <h4 className="font-bold text-blue-900 text-sm truncate">{current.title}</h4>
                            </div>
                            <Link href="/dashboard/student/roadmap" className="text-blue-700 font-bold text-xs bg-white px-3 py-1.5 rounded-lg shadow-sm">Continue</Link>
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <EmptyState text="Generate Roadmap" link="/dashboard/student/skill-gap" />
                  )}
                </div>
              </div>

              {/* ROW 4: Priority Actions & Analytics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm">
                  <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Priority Actions</h2>
                  <div className="space-y-3">
                    <ActionItem num={1} text="Upload ATS-friendly Resume" done={isAssessedResume} link="/dashboard/student/resume" />
                    <ActionItem num={2} text="Close your top 3 skill gaps" done={isAssessedSkill && missingSkillsList.length === 0} link="/dashboard/student/roadmap" />
                    <ActionItem num={3} text="Complete a Mock Interview" done={isAssessedInterview} link="/dashboard/student/mock-interview" />
                    <ActionItem num={4} text="Link your GitHub portfolio" done={isAssessedPortfolio} link="/dashboard/student/portfolio" />
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm flex flex-col">
                  <h2 className="font-bold text-gray-400 uppercase tracking-widest text-xs mb-4">Readiness History</h2>
                  <div className="flex-1 flex flex-col justify-end">
                    {history.length >= 2 ? (
                      <div className="flex items-end gap-2 h-32 pt-4">
                        {history.slice(-10).map((h, i) => (
                          <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                            <div className="absolute -top-8 bg-navy text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              {h.compositeScore}
                            </div>
                            <div 
                              className="w-full bg-blue-100 hover:bg-blue-300 rounded-t-md transition-all border-b-2 border-blue-500"
                              style={{ height: `${Math.max((h.compositeScore / 100) * 100, 5)}%` }}
                            ></div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-32 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-xs font-bold text-gray-400">Compute multiple scores to see history.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ROW 5: Insight */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 shadow-sm">
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0">
                    💡
                  </div>
                  <div>
                    <h3 className="font-black text-blue-900 text-sm mb-1 uppercase tracking-wide">CareerOS Insight</h3>
                    <p className="text-blue-800 text-sm leading-relaxed max-w-4xl">
                      {skillGap?.report?.missingSkills?.insight 
                        || "To improve your overall career readiness, focus on resolving the priority actions listed above. Your AI Mentor is available if you need career advice."}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function MetricCard({ title, score, color }: { title: string, score: number | null, color: string }) {
  const colorMap: any = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    green: 'text-green-600 bg-green-50 border-green-100',
    purple: 'text-purple-600 bg-purple-50 border-purple-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
  };
  const theme = colorMap[color];

  return (
    <div className={`rounded-3xl p-5 border shadow-sm flex flex-col justify-between h-32 ${score !== null ? theme : 'bg-white border-gray-200'}`}>
      <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">{title}</span>
      <div className="flex items-baseline gap-1 mt-2">
        <span className={`text-4xl font-black tracking-tighter ${score !== null ? '' : 'text-gray-300'}`}>
          {score !== null ? score : "-"}
        </span>
        {score !== null && <span className="text-xs font-bold opacity-50">/100</span>}
      </div>
      {score === null && <span className="text-[10px] text-gray-400 font-bold mt-2">Not assessed</span>}
    </div>
  );
}

function EmptyState({ text, link }: { text: string, link: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-6 text-center">
      <Link href={link} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold px-6 py-2.5 rounded-xl shadow-sm transition-colors inline-block">
        {text}
      </Link>
    </div>
  );
}

function ActionItem({ num, text, done, link }: { num: number, text: string, done: boolean, link: string }) {
  return (
    <Link href={link} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${done ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${done ? 'bg-gray-200 text-gray-500' : 'bg-blue-100 text-blue-700'}`}>
        {done ? '✓' : num}
      </div>
      <span className={`text-sm font-medium ${done ? 'text-gray-500 line-through' : 'text-gray-700'}`}>{text}</span>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import {
  getRoadmapRequest,
  updateRoadmapProgressRequest,
  RoadmapResult,
  RoadmapMilestone,
} from "@/lib/api";

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<RoadmapResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getRoadmapRequest()
      .then((data) => {
        setRoadmap(data);
        if (data) {
          // Initialize completed steps based on current progress
          const milestones = (data.milestones ?? []) as RoadmapMilestone[];
          const totalSteps = milestones.length;
          if (totalSteps > 0) {
            const doneCount = Math.round((data.progressPct / 100) * totalSteps);
            const initial = new Set<number>();
            for (let i = 0; i < doneCount; i++) initial.add(i);
            setCompletedSteps(initial);
          }
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const milestones = (roadmap?.milestones ?? []) as RoadmapMilestone[];
  const totalWeeks = milestones.reduce((s, m) => s + (m.estimatedWeeks ?? 0), 0);

  async function toggleStep(idx: number) {
    const next = new Set(completedSteps);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setCompletedSteps(next);

    // Compute new progress %
    const pct = milestones.length > 0 ? Math.round((next.size / milestones.length) * 100) : 0;

    if (roadmap) {
      setSaving(true);
      try {
        await updateRoadmapProgressRequest(roadmap.id, pct);
        setRoadmap({ ...roadmap, progressPct: pct });
      } catch {
        // Revert on failure
        const reverted = new Set(completedSteps);
        setCompletedSteps(reverted);
      } finally {
        setSaving(false);
      }
    }
  }

  const progressPct = roadmap?.progressPct ?? 0;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-4 bg-white max-w-3xl">
          <h1 className="text-2xl font-bold text-navy">Learning Roadmap</h1>

          {loading && <p className="text-gray-400 text-sm">Loading roadmap…</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}

          {!loading && !roadmap && !error && (
            <Card title="No Roadmap Yet" tone="blue">
              <p className="text-sm text-gray-500">
                Run a{" "}
                <a href="/dashboard/student/skill-gap" className="text-accent underline font-medium">
                  Skill Gap Analysis
                </a>{" "}
                first — your personalized learning roadmap will be generated automatically.
              </p>
            </Card>
          )}

          {roadmap && (
            <>
              {/* ── Overview Card ── */}
              <Card title={`Roadmap for: ${roadmap.targetRole}`} tone="gold">
                <div className="flex items-center gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">Overall Progress</span>
                      <span className="font-semibold text-navy">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{completedSteps.size}/{milestones.length} steps done</p>
                    <p>~{totalWeeks} weeks total</p>
                  </div>
                </div>
                {saving && <p className="text-xs text-gray-400">Saving…</p>}
              </Card>

              {/* ── Milestones Timeline ── */}
              <div className="space-y-3">
                {milestones.map((m, idx) => {
                  const done = completedSteps.has(idx);
                  return (
                    <div
                      key={idx}
                      className={`border rounded-xl p-4 transition-all ${
                        done
                          ? "border-green-300 bg-green-50"
                          : "border-ice bg-white"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => toggleStep(idx)}
                          className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            done
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-gray-300 hover:border-accent"
                          }`}
                        >
                          {done && (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>

                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-baseline justify-between">
                            <h3 className={`font-semibold ${done ? "text-green-700 line-through" : "text-navy"}`}>
                              Step {m.step}: {m.title}
                            </h3>
                            <span className="text-xs text-gray-400">
                              ~{m.estimatedWeeks} week{m.estimatedWeeks !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm text-gray-600 mt-1">{m.description}</p>

                          {/* Skills covered */}
                          {m.skills?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {m.skills.map((s) => (
                                <span
                                  key={s}
                                  className="px-2 py-0.5 rounded-full bg-white border border-navy/20 text-xs text-navy"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Resources */}
                          {m.resources?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-400 mb-1">Suggested resources:</p>
                              <ul className="text-xs text-gray-600 list-disc list-inside">
                                {m.resources.map((r, i) => (
                                  <li key={i}>{r}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Skills to Learn ── */}
              {roadmap.missingSkills?.length > 0 && (
                <Card title="Skills to Learn" tone="blue">
                  <div className="flex flex-wrap gap-2">
                    {roadmap.missingSkills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-full bg-white border border-amber-600/30 text-xs text-amber-800"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import {
  getReadinessScoreRequest,
  computeReadinessScoreRequest,
  getSkillGapReportsRequest,
  ReadinessBreakdown,
} from "@/lib/api";

interface ScoreState {
  compositeScore: number;
  breakdown: ReadinessBreakdown;
  computedAt: string;
}

export default function StudentDashboardPage() {
  const [score, setScore] = useState<ScoreState | null>(null);
  const [loading, setLoading] = useState(true);
  const [computing, setComputing] = useState(false);
  const [error, setError] = useState("");
  const [targetRole, setTargetRole] = useState<string | null>(null);
  const [missingCount, setMissingCount] = useState<number | null>(null);

  // Fetch the latest readiness score and target role on mount.
  useEffect(() => {
    Promise.all([
      getReadinessScoreRequest().catch(() => null),
      getSkillGapReportsRequest().catch(() => []),
    ]).then(([scoreData, reports]) => {
      if (scoreData) {
        setScore({
          compositeScore: scoreData.compositeScore,
          breakdown: scoreData.breakdown,
          computedAt: scoreData.computedAt,
        });
      }
      // The first report is the most recent (ordered desc from backend).
      if (reports.length > 0) {
        setTargetRole(reports[0].targetRole);
        setMissingCount(
          Array.isArray(reports[0].missingSkills) ? reports[0].missingSkills.length : 0
        );
      }
    }).finally(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setComputing(true);
    setError("");
    try {
      const data = await computeReadinessScoreRequest();
      setScore({
        compositeScore: data.compositeScore,
        breakdown: data.breakdown,
        computedAt: data.computedAt,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setComputing(false);
    }
  }

  const breakdown = score?.breakdown ?? { ats: 0, skillGap: 0, interview: 0, portfolio: 0 };

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-4 bg-white">
          {/* ── Readiness Score Card ── */}
          <Card title="Career Readiness Score" tone="gold">
            {loading ? (
              <p className="text-gray-400 text-sm">Loading score…</p>
            ) : (
              <>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold text-navy">
                    {score ? score.compositeScore : "—"}/100
                  </p>
                  <button
                    onClick={handleRefresh}
                    disabled={computing}
                    className="px-3 py-1 rounded-lg bg-navy text-white text-xs font-medium disabled:opacity-50"
                  >
                    {computing ? "Computing…" : "Refresh Score"}
                  </button>
                </div>

                {error && <p className="text-red-600 text-xs mt-1">{error}</p>}

                {/* Breakdown bars */}
                <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <BreakdownBar label="ATS Score" value={breakdown.ats} color="bg-blue-500" />
                  <BreakdownBar label="Skill Gap" value={breakdown.skillGap} color="bg-green-500" />
                  <BreakdownBar label="Interview" value={breakdown.interview} color="bg-purple-500" />
                  <BreakdownBar label="Portfolio" value={breakdown.portfolio} color="bg-orange-500" />
                </div>

                {score && (
                  <p className="text-xs text-gray-400 mt-2">
                    Last computed:{" "}
                    {new Date(score.computedAt).toLocaleString()}
                  </p>
                )}

                {!score && !error && (
                  <p className="text-xs text-gray-500 mt-2">
                    No score yet — click &quot;Refresh Score&quot; to compute your first readiness score.
                  </p>
                )}
              </>
            )}
          </Card>

          {/* ── Target Role ── */}
          <Card title="Target Role" tone="blue">
            {targetRole ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-navy">{targetRole}</p>
                  <p className="text-sm text-gray-500">
                    {missingCount === 0
                      ? "All skills matched — you're ready!"
                      : `${missingCount} skill${missingCount === 1 ? "" : "s"} still to learn`}
                  </p>
                </div>
                <a
                  href="/dashboard/student/skill-gap"
                  className="px-3 py-1.5 rounded-lg border border-navy text-navy text-xs font-medium hover:bg-navy hover:text-white transition"
                >
                  Change / Re-analyze
                </a>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500 italic">
                  No target role set yet — run a skill gap analysis to get started.
                </p>
                <a
                  href="/dashboard/student/skill-gap"
                  className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium"
                >
                  Set Target Role
                </a>
              </div>
            )}
          </Card>

          {/* ── Quick Actions ── */}
          <Card title="Quick Actions" tone="green">
            <div className="flex gap-3 flex-wrap">
              <a
                href="/dashboard/student/resume"
                className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium"
              >
                Upload Resume
              </a>
              <a
                href="/dashboard/student/skill-gap"
                className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium"
              >
                Skill Gap Analysis
              </a>
              <a
                href="/dashboard/student/mentor"
                className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium"
              >
                AI Mentor
              </a>
              <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium" disabled>
                Start Mock Interview
              </button>
            </div>
          </Card>

          {/* ── Progress Analytics ── */}
          <Card title="Progress Analytics" tone="blue">
            Readiness trend chart goes here (wire up once the Readiness Score history
            endpoint exists).
          </Card>

          {/* ── AI Mentor ── */}
          <Card title="AI Mentor" tone="green">
            <p className="italic text-gray-500">No recent conversation yet.</p>
            <input
              placeholder="Ask a question…"
              className="mt-2 w-full border rounded-lg px-3 py-1.5 text-sm"
              disabled
            />
          </Card>
        </main>
      </div>
    </div>
  );
}

/* ── Breakdown bar sub-component ── */

function BreakdownBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-0.5">
        <span className="text-gray-600">{label}</span>
        <span className="font-semibold text-navy">{value}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

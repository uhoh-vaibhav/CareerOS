import { Card } from "@/components/Card";
import { Sidebar } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";

// Static placeholder data — replace with a call to the backend once
// the Readiness Score / roadmap / mentor endpoints exist (see SRS PORT-04, SKL-03, MEN-01).
const placeholder = {
  readinessScore: 62,
  breakdown: { ats: 70, skillGap: 55, interview: 60, portfolio: 65 },
};

export default function StudentDashboardPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-4 bg-white">
          <Card title="Career Readiness Score" tone="gold">
            <p className="text-3xl font-bold text-navy">{placeholder.readinessScore}/100</p>
            <p className="mt-1">
              ATS {placeholder.breakdown.ats} &middot; Skill Gap {placeholder.breakdown.skillGap} &middot;{" "}
              Interview {placeholder.breakdown.interview} &middot; Portfolio {placeholder.breakdown.portfolio}
            </p>
          </Card>

          <Card title="Quick Actions" tone="green">
            <div className="flex gap-3 flex-wrap">
              <a
                href="/dashboard/student/resume"
                className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium"
              >
                Upload Resume
              </a>
              <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium" disabled>
                Continue Roadmap
              </button>
              <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium" disabled>
                Start Mock Interview
              </button>
            </div>
          </Card>

          <Card title="Progress Analytics" tone="blue">
            Readiness trend chart goes here (wire up once the Readiness Score history
            endpoint exists).
          </Card>

          <Card title="AI Mentor" tone="green">
            {/* NOTE: JSX string attributes don't process \u escapes — that's what
                produced the literal "\u2026" text before. Use the real character
                (or {"\u2026"} as a JS expression) instead. */}
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

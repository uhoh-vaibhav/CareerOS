with open("src/app/dashboard/student/portfolio/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_ui = """"use client";

import { useState, useEffect } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { linkPortfolioRequest, getPortfolioRequest, GitHubPortfolio } from "@/lib/api";

export default function PortfolioPage() {
  const [username, setUsername] = useState("");
  const [portfolio, setPortfolio] = useState<GitHubPortfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    getPortfolioRequest()
      .then(res => {
        if (res) setPortfolio(res);
      })
      .catch(err => console.error("Failed to load portfolio", err))
      .finally(() => setInitialLoad(false));
  }, []);

  async function handleLink() {
    if (!username.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await linkPortfolioRequest(username);
      setPortfolio(res);
    } catch (err: any) {
      setError(err.message || "Failed to link portfolio");
    } finally {
      setLoading(false);
    }
  }

  const analysis = portfolio?.analysisJson || {} as any;
  const score = analysis?.score || 0;

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 space-y-6 bg-background">
          <div className="max-w-4xl">
            <h1 className="text-2xl font-bold text-navy">GitHub Portfolio Integration</h1>
            <p className="text-sm text-text-muted mt-1">
              Link your GitHub account to analyze your open-source activity. Our AI analyzes your repositories to uncover strengths and recommend projects that will impress recruiters.
            </p>
          </div>

          {!portfolio && initialLoad && (
            <p className="text-sm text-text-muted animate-pulse">Scanning GitHub activity...</p>
          )}

          {!portfolio && !initialLoad && (
            <div className="max-w-2xl">
              <Card title="Connect GitHub" tone="blue">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">GitHub Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. torvalds"
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-navy outline-none transition-all shadow-sm"
                      onKeyDown={(e) => e.key === "Enter" && handleLink()}
                    />
                  </div>
                  <button
                    onClick={handleLink}
                    disabled={loading || !username.trim()}
                    className="btn-primary text-sm px-6 py-2.5"
                  >
                    {loading ? "Analyzing..." : "Link & Analyze"}
                  </button>
                </div>
                {error && <p className="text-sm text-red-600 mt-3 font-medium">{error}</p>}
              </Card>
            </div>
          )}

          {portfolio && (
            <div className="max-w-5xl space-y-6">
              {/* Header Bar */}
              <div className="flex items-center justify-between bg-white shadow-sm p-4 rounded-2xl border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-navy to-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-black shadow-md">
                    {portfolio.githubUsername.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-navy">github.com/{portfolio.githubUsername}</h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Last synced: {new Date(portfolio.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setUsername(portfolio.githubUsername);
                    setPortfolio(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  Change Account
                </button>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Score Card */}
                <Card title="Portfolio Assessment" tone="gold" className="md:col-span-1">
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="text-6xl font-black text-navy tracking-tighter mb-2">
                      {score}<span className="text-3xl text-gray-400">/100</span>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
                      score >= 80 ? 'bg-green-100 text-green-800 border border-green-200' :
                      score >= 60 ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {score >= 80 ? 'Outstanding' : score >= 60 ? 'Solid Foundation' : 'Needs Expansion'}
                    </span>
                    <p className="text-xs text-center text-gray-500 mt-4 leading-relaxed">
                      This score evaluates your repository complexity, technology breadth, and coding consistency.
                    </p>
                  </div>
                </Card>

                {/* Details Column */}
                <div className="md:col-span-2 space-y-6">
                  <Card title="Key Strengths" tone="green">
                    <div className="space-y-3">
                      {(analysis.strengths || []).length > 0 ? (
                        (analysis.strengths).map((s: string, i: number) => (
                          <div key={i} className="flex gap-3 items-start bg-green-50/50 p-3 rounded-lg border border-green-100">
                            <span className="text-green-600 mt-0.5">?</span>
                            <span className="text-sm text-gray-800 font-medium">{s}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No specific strengths detected.</p>
                      )}
                    </div>
                  </Card>

                  <Card title="Areas for Improvement" tone="gold">
                    <div className="space-y-3">
                      {(analysis.weaknesses || []).length > 0 ? (
                        (analysis.weaknesses).map((w: string, i: number) => (
                          <div key={i} className="flex gap-3 items-start bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                            <span className="text-amber-600 mt-0.5">!</span>
                            <span className="text-sm text-gray-800 font-medium">{w}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">No specific weaknesses detected.</p>
                      )}
                    </div>
                  </Card>
                </div>
              </div>

              {/* What to Build Next */}
              <Card title="Recommended Next Projects" tone="blue">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  {(analysis.suggestions || []).length > 0 ? (
                    (analysis.suggestions).map((s: string, i: number) => (
                      <div key={i} className="bg-gradient-to-br from-blue-50 to-white p-4 rounded-xl border border-blue-100 shadow-sm flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">
                          {i + 1}
                        </div>
                        <p className="text-sm text-gray-800 font-medium leading-relaxed">{s}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 italic col-span-2">No recommendations available at this time.</p>
                  )}
                </div>
              </Card>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/portfolio/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_ui)

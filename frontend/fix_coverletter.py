with open("src/app/dashboard/student/cover-letter/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

new_ui = """"use client";

import { useState, useEffect } from "react";
import { Sidebar, STUDENT_LINKS } from "@/components/Sidebar";
import { TopNav } from "@/components/TopNav";
import { Card } from "@/components/Card";
import { generateCoverLetterRequest, listCoverLettersRequest, CoverLetter } from "@/lib/api";

export default function CoverLetterPage() {
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<CoverLetter[]>([]);
  const [activeLetter, setActiveLetter] = useState<CoverLetter | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      const data = await listCoverLettersRequest();
      setHistory(data);
    } catch (err: any) {
      console.error("Failed to fetch cover letters", err);
    }
  }

  async function handleGenerate() {
    if (!jobDesc.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await generateCoverLetterRequest(jobDesc);
      setActiveLetter(res);
      setJobDesc("");
      fetchHistory(); // refresh the history list
    } catch (err: any) {
      setError(err.message || "Failed to generate cover letter.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (activeLetter) {
      navigator.clipboard.writeText(activeLetter.content);
      alert("Copied to clipboard!");
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNav role="Student" />
      <div className="flex flex-1">
        <Sidebar links={STUDENT_LINKS} />
        <main className="flex-1 p-6 bg-background flex flex-col md:flex-row gap-6">
          
          {/* Left Column: Input and History */}
          <div className="w-full md:w-1/3 flex flex-col gap-6">
            
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h2 className="font-bold text-navy text-lg mb-1 flex items-center gap-2">
                <span className="text-xl">??</span> New Cover Letter
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Paste a job description. AI will merge it with your verified skills.
              </p>
              
              <textarea
                className="w-full border border-gray-300 rounded-xl p-3 text-sm min-h-[180px] focus:ring-2 focus:ring-navy outline-none shadow-inner resize-none bg-gray-50"
                placeholder="Paste the target job description here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
              />
              {error && <p className="text-xs text-red-600 mt-2 font-bold p-2 bg-red-50 rounded-lg">{error}</p>}
              
              <button
                onClick={handleGenerate}
                disabled={loading || !jobDesc.trim()}
                className="btn-primary w-full mt-4 py-2.5 shadow-sm text-sm"
              >
                {loading ? "Generating Magic..." : "Generate AI Cover Letter"}
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-navy text-sm">Past Cover Letters</h3>
              </div>
              <div className="overflow-y-auto p-3 space-y-2 flex-1 max-h-[300px]">
                {history.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center p-4">No history yet.</p>
                ) : (
                  history.map((letter) => (
                    <button
                      key={letter.id}
                      onClick={() => setActiveLetter(letter)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        activeLetter?.id === letter.id
                          ? "bg-blue-50 border-blue-200"
                          : "bg-white border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <p className="text-xs font-bold text-navy truncate">
                        {letter.jobDescription.substring(0, 40)}...
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {new Date(letter.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Output */}
          <div className="w-full md:w-2/3">
            {activeLetter ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <h3 className="font-bold text-navy">Generated Output</h3>
                  <button
                    onClick={handleCopy}
                    className="px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded-lg shadow-sm hover:bg-gray-50"
                  >
                    Copy to Clipboard
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 bg-white">
                  <div className="max-w-2xl mx-auto prose prose-sm prose-a:text-blue-600 prose-headings:text-navy">
                    <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed text-sm">
                      {activeLetter.content}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="text-5xl mb-4 opacity-50">??</div>
                <h3 className="font-bold text-navy text-lg mb-2">No Cover Letter Selected</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Generate a new cover letter on the left or select a previous one to view the output here.
                </p>
              </div>
            )}
          </div>
          
        </main>
      </div>
    </div>
  );
}
"""

with open("src/app/dashboard/student/cover-letter/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_ui)

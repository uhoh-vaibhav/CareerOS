# -*- coding: utf-8 -*-
import re

with open("src/app/dashboard/student/roadmap/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add import
content = content.replace("updateRoadmapProgressRequest, RoadmapResult", "updateRoadmapProgressRequest, RoadmapResult, generateStudyMaterialRequest")

# Add state for study mode
state_block = """  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());
  
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
"""
content = content.replace("  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set());", state_block)

# Add the UI buttons to the subtask card
old_subtask_ui = """                                        <div className="flex flex-wrap items-center gap-3">
                                          {st.estimatedTime && (
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                              ⏱ {st.estimatedTime}
                                            </span>
                                          )}
                                          {st.skills?.map((s: string) => (
                                            <span key={s} className="text-[10px] font-bold text-gray-600 border border-gray-200 px-2 py-1 rounded">
                                              {s}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    </div>"""

new_subtask_ui = """                                        <div className="flex flex-wrap items-center gap-3">
                                          {st.estimatedTime && (
                                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                              ⏱ {st.estimatedTime}
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
                                          
                                          {/* Use router or regular link for mentor. We just use Link. */}
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
                                    </div>"""

content = content.replace(old_subtask_ui, new_subtask_ui)

with open("src/app/dashboard/student/roadmap/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

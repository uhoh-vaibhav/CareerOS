import os

with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_str = 'import { Card } from "@/components/Card";'
new_import_str = '''import { Card } from "@/components/Card";
import { getDailyChallengeRequest, submitDailyChallengeRequest, DailyChallenge } from "@/lib/api";'''

content = content.replace(import_str, new_import_str)

state_str = 'const [missingCount, setMissingCount] = useState<number | null>(null);'
new_state_str = '''const [missingCount, setMissingCount] = useState<number | null>(null);
  
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [challengeAnswers, setChallengeAnswers] = useState<number[]>([]);
  const [challengeSubmitting, setChallengeSubmitting] = useState(false);'''

content = content.replace(state_str, new_state_str)

effect_str = 'getSkillGapReportsRequest().catch(() => []),'
new_effect_str = '''getSkillGapReportsRequest().catch(() => []),
      getDailyChallengeRequest().catch(() => null),'''

content = content.replace(effect_str, new_effect_str)

effect_resolve_str = '}).finally(() => setLoading(false));'
new_effect_resolve_str = '''}).then(([scoreData, reports, challengeData]: any) => {
      if (scoreData) {
        setScore({
          compositeScore: scoreData.compositeScore,
          breakdown: scoreData.breakdown,
          computedAt: scoreData.computedAt,
        });
      }
      if (reports && reports.length > 0) {
        setTargetRole(reports[0].targetRole);
        setMissingCount(
          Array.isArray(reports[0].missingSkills) ? reports[0].missingSkills.length : 0
        );
      }
      if (challengeData) {
        setChallenge(challengeData);
        setChallengeAnswers(new Array(challengeData.questions.length).fill(-1));
      }
    }).finally(() => setLoading(false));'''

# Re-replace the whole Promise.all inside useEffect
old_promise = '''Promise.all([
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
    }).finally(() => setLoading(false));'''

new_promise = '''Promise.all([
      getReadinessScoreRequest().catch(() => null),
      getSkillGapReportsRequest().catch(() => []),
      getDailyChallengeRequest().catch(() => null),
    ]).then(([scoreData, reports, challengeData]) => {
      if (scoreData) {
        setScore({
          compositeScore: scoreData.compositeScore,
          breakdown: scoreData.breakdown,
          computedAt: scoreData.computedAt,
        });
      }
      if (reports && reports.length > 0) {
        setTargetRole(reports[0].targetRole);
        setMissingCount(
          Array.isArray(reports[0].missingSkills) ? reports[0].missingSkills.length : 0
        );
      }
      if (challengeData) {
        setChallenge(challengeData);
        setChallengeAnswers(new Array(challengeData.questions.length).fill(-1));
      }
    }).finally(() => setLoading(false));'''

content = content.replace(old_promise, new_promise)

submit_fn = '''
  async function handleChallengeSubmit() {
    if (!challenge) return;
    if (challengeAnswers.includes(-1)) {
      alert("Please answer all questions before submitting.");
      return;
    }
    setChallengeSubmitting(true);
    try {
      const res = await submitDailyChallengeRequest(challengeAnswers);
      setChallenge(res);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setChallengeSubmitting(false);
    }
  }
'''

content = content.replace('const breakdown = score?.breakdown', submit_fn + '\n  const breakdown = score?.breakdown')

widget_str = '{/* "?"? Readiness Score Card "?"? */}'
new_widget_str = '''
          {/* ?? Daily Challenge Widget ?? */}
          {challenge && (
            <Card title="Daily AI Micro-Challenge" tone="blue">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-muted">
                  A quick quiz based on your skill gaps to keep you sharp!
                </p>
                {challenge.isCompleted && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                    Score: {challenge.score}/{challenge.questions.length}
                  </span>
                )}
              </div>

              {!challenge.isCompleted ? (
                <div className="space-y-6">
                  {challenge.questions.map((q, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-xl border border-border">
                      <p className="font-bold text-navy mb-3">{i + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((opt, oIdx) => (
                          <label key={oIdx} className="flex items-center gap-3 p-2 border rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                            <input 
                              type="radio" 
                              name={`question-${i}`} 
                              checked={challengeAnswers[i] === oIdx}
                              onChange={() => {
                                const newAns = [...challengeAnswers];
                                newAns[i] = oIdx;
                                setChallengeAnswers(newAns);
                              }}
                              className="text-navy focus:ring-navy h-4 w-4"
                            />
                            <span className="text-sm text-gray-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <button 
                      onClick={handleChallengeSubmit} 
                      disabled={challengeSubmitting || challengeAnswers.includes(-1)}
                      className="btn-primary text-sm"
                    >
                      {challengeSubmitting ? "Submitting..." : "Submit Answers"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {challenge.questions.map((q, i) => {
                    const isCorrect = q.correct_answer_index !== undefined && challengeAnswers[i] === q.correct_answer_index;
                    return (
                      <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                        <p className="font-bold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                        <p className="text-sm mb-1 text-gray-700">
                          <span className="font-semibold">Your Answer:</span> {q.options[challengeAnswers[i]]}
                        </p>
                        {!isCorrect && q.correct_answer_index !== undefined && (
                          <p className="text-sm mb-1 text-green-700">
                            <span className="font-semibold">Correct Answer:</span> {q.options[q.correct_answer_index]}
                          </p>
                        )}
                        {q.explanation && (
                          <p className="text-sm mt-3 text-gray-600 bg-white p-2 rounded border border-gray-100">
                            ?? {q.explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                  <p className="text-center text-sm font-bold text-navy mt-4">Come back tomorrow for a new challenge!</p>
                </div>
              )}
            </Card>
          )}

          {/* "?"? Readiness Score Card "?"? */}'''

content = content.replace(widget_str, new_widget_str)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

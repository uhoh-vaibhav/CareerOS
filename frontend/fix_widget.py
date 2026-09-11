with open("src/app/dashboard/student/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Instead of looking for weird emojis, I will look for `<main className="flex-1 p-6 space-y-6 bg-background">`
# and insert the widget right after it.

main_tag = '<main className="flex-1 p-6 space-y-6 bg-background">'
widget = """
          {/* ?? Daily Challenge Widget ?? */}
          {challenge && (
            <Card title="Daily AI Micro-Challenge" tone="blue">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-text-muted">
                  A quick quiz based on your skill gaps to keep you sharp!
                </p>
                {challenge.isCompleted && challenge.score !== null && (
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
                    // If challengeAnswers[i] is -1, it means the challenge was completed in a previous session
                    const answeredInPast = challengeAnswers[i] === -1;
                    
                    return (
                      <div key={i} className={`p-4 rounded-xl border ${!answeredInPast && isCorrect ? 'border-green-200 bg-green-50' : (!answeredInPast && !isCorrect ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50')}`}>
                        <p className="font-bold text-gray-800 mb-2">{i + 1}. {q.question}</p>
                        
                        {!answeredInPast && (
                          <p className="text-sm mb-1 text-gray-700">
                            <span className="font-semibold">Your Answer:</span> {q.options[challengeAnswers[i]]}
                          </p>
                        )}
                        
                        {q.correct_answer_index !== undefined && (
                          <p className={`text-sm mb-1 ${!answeredInPast && isCorrect ? 'text-green-700' : 'text-blue-700'}`}>
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
"""
if widget not in content:
    content = content.replace(main_tag, main_tag + "\n" + widget)

with open("src/app/dashboard/student/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)

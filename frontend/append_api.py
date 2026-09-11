with open("src/lib/api.ts", "a", encoding="utf-8") as f:
    f.write("""
/* --------------------- Cover Letter API --------------------- */

export interface CoverLetter {
  id: string;
  jobDescription: string;
  content: string;
  createdAt: string;
}

export async function generateCoverLetterRequest(jobDescription: string): Promise<CoverLetter> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/cover-letter/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ jobDescription }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Request failed");
  }
  const data = await res.json();
  return data.coverLetter;
}

export async function listCoverLettersRequest(): Promise<CoverLetter[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/cover-letter`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.coverLetters;
}

/* --------------------- Daily Challenge API --------------------- */

export interface DailyChallengeQuestion {
  question: string;
  options: string[];
  correct_answer_index?: number;
  explanation?: string;
}

export interface DailyChallenge {
  id: string;
  date: string;
  questions: DailyChallengeQuestion[];
  score: number | null;
  isCompleted: boolean;
}

export async function getDailyChallengeRequest(): Promise<DailyChallenge> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/daily-challenge`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.challenge;
}

export async function submitDailyChallengeRequest(answers: number[]): Promise<DailyChallenge> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/daily-challenge/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.challenge;
}
""")

with open('src/lib/api.ts', 'a', encoding='utf-8') as f:
    f.write("""
export interface Certificate {
  id: string;
  title: string;
  issuer: string | null;
  fileUrl: string;
  createdAt: string;
}

export interface GitHubPortfolio {
  id: string;
  githubUsername: string;
  analysisJson: any;
  createdAt: string;
}

export async function getLatestResumeRequest(): Promise<ResumeParseResult | null> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/resume`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.resumes && data.resumes.length > 0 ? data.resumes[0] : null;
}

export async function getLatestSkillGapRequest(): Promise<SkillGapResult | null> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/skill-gap`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.reports && data.reports.length > 0 ? { report: data.reports[0], currentSkills: data.currentSkills } : null;
}
""")

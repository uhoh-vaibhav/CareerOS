const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string; createdAt: string };
}

export interface ResumeParseResult {
  resume: { id: string; fileUrl: string; atsScore: number; createdAt: string };
  parsed: {
    skills: string[];
    ats_score: number;
    ats_breakdown: Record<string, number>;
    feedback: string;
  };
}

export interface SkillGapResult {
  report: {
    id: string;
    targetRole: string;
    missingSkills: string[];
    createdAt: string;
    roadmap: { milestones: { text: string }; progressPct: number } | null;
  };
  currentSkills: string[];
}

export interface MentorSendResult {
  session: { id: string; summary: string; createdAt: string };
  reply: string;
  retrievedContext: string[];
}

export interface MentorSession {
  id: string;
  summary: string;
  createdAt: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function registerRequest(email: string, password: string) {
  return request<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function loginRequest(email: string, password: string) {
  return request<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function uploadResumeRequest(file: File): Promise<ResumeParseResult> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const formData = new FormData();
  formData.append("resume", file);

  const res = await fetch(`${API_BASE}/api/v1/student/resume`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    // NOTE: do NOT set Content-Type manually here — the browser needs to set
    // it itself (including the multipart boundary) for FormData uploads.
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Upload failed with status ${res.status}`);
  }

  return res.json() as Promise<ResumeParseResult>;
}

export async function analyzeSkillGapRequest(targetRole: string): Promise<SkillGapResult> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/skill-gap`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target_role: targetRole }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<SkillGapResult>;
}

export async function sendMentorMessageRequest(message: string): Promise<MentorSendResult> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/mentor`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json() as Promise<MentorSendResult>;
}

export async function getMentorHistoryRequest(): Promise<MentorSession[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/mentor`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { sessions: MentorSession[] };
  return data.sessions;
}

/* ───────────────────── Skill Gap List ───────────────────── */

export interface SkillGapReportSummary {
  id: string;
  targetRole: string;
  missingSkills: string[];
  createdAt: string;
}

export async function getSkillGapReportsRequest(): Promise<SkillGapReportSummary[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/skill-gap`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { reports: SkillGapReportSummary[] };
  return data.reports;
}

/* ───────────────────── Readiness Score ───────────────────── */

export interface ReadinessBreakdown {
  ats: number;
  skillGap: number;
  interview: number;
  portfolio: number;
}

export interface ReadinessScoreResult {
  id: string;
  compositeScore: number;
  breakdown: ReadinessBreakdown;
  computedAt: string;
}

export async function getReadinessScoreRequest(): Promise<ReadinessScoreResult | null> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/readiness`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { score: ReadinessScoreResult | null };
  return data.score;
}

export async function computeReadinessScoreRequest(): Promise<ReadinessScoreResult> {
  const token = localStorage.getItem("careeros_token");
  if (!token) {
    throw new Error("Not logged in");
  }

  const res = await fetch(`${API_BASE}/api/v1/student/readiness`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  const data = (await res.json()) as { score: ReadinessScoreResult };
  return data.score;
}
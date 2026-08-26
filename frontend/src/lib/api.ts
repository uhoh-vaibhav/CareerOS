const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AuthResponse {
  token: string;
  user: { id: string; email: string; role: string; createdAt: string };
}

export interface ResumeParseResult {
  resume: { id: string; fileUrl: string; atsScore: number; createdAt: string };
  parsed: { skills: string[]; ats_score: number; feedback: string };
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

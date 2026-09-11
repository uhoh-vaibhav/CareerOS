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
    missingSkills: any;
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

export function registerRequest(name: string, email: string, password: string, role?: string) {
  return request<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, role }),
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

/* ───────────────────── Admin API ───────────────────── */

export async function getAdminStatsRequest(): Promise<{ totalUsers: number, byRole: Record<string, number>, totalResumes: number, totalJobPostings: number }> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/admin`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function getAdminUsersRequest(role?: string): Promise<{ users: any[] }> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const url = role ? `${API_BASE}/api/v1/admin/users?role=${encodeURIComponent(role)}` : `${API_BASE}/api/v1/admin/users`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function changeUserRoleRequest(userId: string, role: string): Promise<{ user: any }> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

/* ───────────────────── Recruiter API ───────────────────── */

export async function createJobPostingRequest(title: string, requiredSkills: string[]): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/recruiter`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ title, requiredSkills }),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function getRecruiterJobsRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/recruiter`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function getJobApplicationsRequest(jobId: string): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/recruiter/${jobId}/applications`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function updateJobStatusRequest(jobId: string, status: string): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/recruiter/${jobId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

/* ───────────────────── Placement API ───────────────────── */

export async function getPlacementOverviewRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/placement`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function getPlacementStudentsRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/placement/students`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

/* ───────────────────── Faculty API ───────────────────── */

export async function getFacultyStudentsRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/faculty/students`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

export async function getFacultyStudentDetailRequest(profileId: string): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/faculty/students/${profileId}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error("Request failed");
  return res.json();
}

/* ───────────────────── Roadmap API ───────────────────── */

export interface RoadmapMilestone {
  step: number;
  title: string;
  description: string;
  skills: string[];
  resources: string[];
  estimatedWeeks: number;
  isCompleted?: boolean;
  subtasks?: {
    title: string;
    description: string;
    estimatedTime?: string;
    skills?: string[];
    resources?: string[];
    isCompleted?: boolean;
    generatedMaterial?: any;
  }[];
}

export interface RoadmapResult {
  id: string;
  targetRole: string;
  missingSkills: string[];
  milestones: RoadmapMilestone[];
  progressPct: number;
  createdAt: string;
}

export async function getRoadmapRequest(): Promise<RoadmapResult | null> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/roadmap`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = (await res.json()) as { roadmap: RoadmapResult | null };
  return data.roadmap;
}

export async function getRoadmapHistoryRequest(): Promise<RoadmapResult[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/roadmap/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = (await res.json()) as { roadmaps: RoadmapResult[] };
  return data.roadmaps;
}

export async function updateRoadmapProgressRequest(roadmapId: string, progressPct: number, completedSteps?: (number | string)[]): Promise<void> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/roadmap/${roadmapId}/progress`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ progressPct, completedSteps }),
  });
  if (!res.ok) throw new Error("Request failed");
}
/* --------------------- Mock Interview API --------------------- */

export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface MockInterviewGenerateResponse {
  questions: string[];
}

export interface MockInterviewEvaluateResponse {
  id: string;
  role: string;
  score: number;
  feedback: { qa?: QuestionAnswer[]; feedback?: string; confidenceScore?: number; communicationFeedback?: string; } | string | null;
  createdAt: string;
}

export async function generateMockInterviewRequest(targetRole: string): Promise<MockInterviewGenerateResponse> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/mock-interview/generate`, {
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

  return res.json();
}

export async function evaluateMockInterviewRequest(targetRole: string, qaPairs: QuestionAnswer[]): Promise<MockInterviewEvaluateResponse> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/mock-interview/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ target_role: targetRole, qa_pairs: qaPairs }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

export async function getMockInterviewsRequest(): Promise<{ interviews: MockInterviewEvaluateResponse[] }> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/mock-interview`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed with status ${res.status}`);
  }

  return res.json();
}

/* --------------------- Portfolio API --------------------- */

export async function getPortfolioRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/portfolio`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.portfolio;
}

export async function linkPortfolioRequest(githubUsername: string): Promise<GitHubPortfolio> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/portfolio/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ github_username: githubUsername }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || "Request failed");
  }
  const data = await res.json();
  return data;
}

/* --------------------- Certificates API --------------------- */

export async function getCertificatesRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/certificates`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.certificates;
}

export async function uploadCertificateRequest(title: string, issuer: string, file: File): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const formData = new FormData();
  formData.append("title", title);
  if (issuer) formData.append("issuer", issuer);
  if (file) formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/v1/student/certificates`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });

  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data;
}

export async function deleteCertificateRequest(id: string): Promise<void> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/certificates/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
}

/* --------------------- Profile API --------------------- */

export async function getProfileRequest(): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Request failed");
  const data = await res.json();
  return data.profile;
}

export async function updateProfileRequest(data: any): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");
  const res = await fetch(`${API_BASE}/api/v1/student/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Request failed");
  const resData = await res.json();
  return resData.profile;
}

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
  updatedAt: string;
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
  if (data.resumes && data.resumes.length > 0) {
    const r = data.resumes[0];
    return {
      resume: {
        id: r.id,
        fileUrl: r.fileUrl,
        atsScore: r.atsScore,
        createdAt: r.createdAt,
      },
      parsed: {
        ...r.parsedJson,
        ats_score: r.atsScore
      },
    };
  }
  return null;
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

export async function getReadinessHistoryRequest(): Promise<ReadinessScoreResult[]> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/readiness/history`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`Request failed with status ${res.status}`);
  }

  const data = await res.json();
  return data.history || [];
}

export async function generateStudyMaterialRequest(roadmapId: string, phaseIdx: number, subtaskIdx: number, forceRegenerate: boolean = false): Promise<any> {
  const token = localStorage.getItem("careeros_token");
  if (!token) throw new Error("Not logged in");

  const res = await fetch(`${API_BASE}/api/v1/student/roadmap/${roadmapId}/material`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ phaseIdx, subtaskIdx, forceRegenerate }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to generate study material");
  }

  const data = await res.json();
  return data.material;
}

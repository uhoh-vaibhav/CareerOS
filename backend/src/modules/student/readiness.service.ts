import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

/**
 * Readiness Score weights — must sum to 1.0.
 * Adjust these as the platform matures.
 */
const WEIGHTS = {
  ats: 0.3,
  skillGap: 0.3,
  interview: 0.2,
  portfolio: 0.2,
} as const;

interface Breakdown {
  ats: number;
  skillGap: number;
  interview: number;
  portfolio: number;
}

/**
 * PORT-04: Computes a weighted composite readiness score (0-100) by
 * aggregating the student's latest data across four dimensions:
 *
 *   ATS score         (30%) — from their most recent parsed resume
 *   Skill-gap score   (30%) — inverse of missing skills count from latest report
 *   Interview score   (20%) — from their most recent mock interview
 *   Portfolio score   (20%) — from their GitHub portfolio analysis (future)
 *
 * Dimensions with no data default to 0, so the score naturally grows
 * as the student completes more activities on the platform.
 */
export async function computeReadinessScore(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      resumes: { orderBy: { createdAt: "desc" }, take: 1 },
      skillGapReports: { orderBy: { createdAt: "desc" }, take: 1 },
      mockInterviews: { orderBy: { createdAt: "desc" }, take: 1 },
      portfolio: true,
    },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  // --- ATS dimension ---
  const latestResume = profile.resumes[0];
  const ats = latestResume?.atsScore ?? 0;

  // --- Skill-gap dimension ---
  // Fewer missing skills → higher readiness.
  // Formula: 100 - (missingCount × 10), clamped to [0, 100].
  const latestReport = profile.skillGapReports[0];
  let skillGap = 0;
  if (latestReport) {
    const missing = Array.isArray(latestReport.missingSkills)
      ? (latestReport.missingSkills as string[])
      : [];
    skillGap = Math.max(0, Math.min(100, 100 - missing.length * 10));
  }

  // --- Interview dimension ---
  const latestInterview = profile.mockInterviews[0];
  const interview = latestInterview?.score ?? 0;

  // --- Portfolio dimension ---
  // Future: derive a score from GitHubPortfolio.analysisJson.
  // For now, 0 until the portfolio feature is built.
  const portfolioData = profile.portfolio;
  const portfolio = portfolioData?.analysisJson
    ? extractPortfolioScore(portfolioData.analysisJson)
    : 0;

  const breakdown: Breakdown = { ats, skillGap, interview, portfolio };

  const compositeScore = Math.round(
    breakdown.ats * WEIGHTS.ats +
      breakdown.skillGap * WEIGHTS.skillGap +
      breakdown.interview * WEIGHTS.interview +
      breakdown.portfolio * WEIGHTS.portfolio
  );

  // Persist the computed score so we can show history/trends.
  const score = await prisma.readinessScore.create({
    data: {
      profileId: profile.id,
      compositeScore,
      breakdown: breakdown as any,
    },
  });

  return score;
}

/**
 * Returns the most recently computed readiness score, or null if the
 * student has never computed one.
 */
export async function getLatestReadinessScore(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  const latest = await prisma.readinessScore.findFirst({
    where: { profileId: profile.id },
    orderBy: { computedAt: "desc" },
  });

  return latest;
}

/**
 * Returns the full history of readiness scores for the student,
 * ordered chronologically (oldest first) for rendering a trend chart.
 */
export async function getReadinessHistory(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  const history = await prisma.readinessScore.findMany({
    where: { profileId: profile.id },
    orderBy: { computedAt: "asc" },
    select: {
      id: true,
      compositeScore: true,
      breakdown: true,
      computedAt: true,
    },
  });

  return history;
}

/**
 * Placeholder for extracting a 0-100 score from GitHubPortfolio.analysisJson.
 * Will be implemented properly when the Portfolio feature is built.
 */
function extractPortfolioScore(_analysisJson: unknown): number {
  // TODO: Parse analysisJson and derive a meaningful score
  // (e.g. repo count, language diversity, commit frequency, stars).
  return 0;
}

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
  ats: number | null;
  skillGap: number | null;
  interview: number | null;
  portfolio: number | null;
}

/**
 * PORT-04: Computes a weighted composite readiness score (0-100) by
 * aggregating the student's latest data across four dimensions:
 *
 *   ATS score         (30%) — from their most recent parsed resume
 *   Skill-gap score   (30%) — from latest skill gap report
 *   Interview score   (20%) — from their most recent mock interview
 *   Portfolio score   (20%) — from their GitHub portfolio analysis
 *
 * Dimensions with no data are explicitly marked null ("Not Assessed").
 * The composite score normalizes weights across assessed dimensions only,
 * preventing unattempted features from unfairly penalizing the user.
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
  const ats: number | null = latestResume && typeof latestResume.atsScore === "number" ? latestResume.atsScore : null;

  // --- Skill-gap dimension ---
  const latestReport = profile.skillGapReports[0];
  let skillGap: number | null = null;
  if (latestReport) {
    const rawMissing = latestReport.missingSkills as any;
    if (typeof rawMissing?.readinessScore === "number") {
      skillGap = Math.max(0, Math.min(100, Math.round(rawMissing.readinessScore)));
    } else {
      const missing = Array.isArray(rawMissing)
        ? rawMissing
        : Array.isArray(rawMissing?.missingSkills)
        ? rawMissing.missingSkills
        : [];
      skillGap = Math.max(0, Math.min(100, 100 - missing.length * 10));
    }
  }

  // --- Interview dimension ---
  const latestInterview = profile.mockInterviews[0];
  const interview: number | null = latestInterview && typeof latestInterview.score === "number" ? latestInterview.score : null;

  // --- Portfolio dimension ---
  const portfolioData = profile.portfolio;
  const portfolio: number | null = portfolioData?.analysisJson
    ? extractPortfolioScore(portfolioData.analysisJson)
    : null;

  const breakdown: Breakdown = { ats, skillGap, interview, portfolio };

  // Calculate composite score dynamically normalized across assessed dimensions
  const rawDims: { score: number | null; weight: number }[] = [
    { score: ats, weight: WEIGHTS.ats },
    { score: skillGap, weight: WEIGHTS.skillGap },
    { score: interview, weight: WEIGHTS.interview },
    { score: portfolio, weight: WEIGHTS.portfolio },
  ];
  const assessedDimensions = rawDims.filter(
    (d): d is { score: number; weight: number } => d.score !== null
  );

  let compositeScore = 0;
  if (assessedDimensions.length > 0) {
    const totalWeight = assessedDimensions.reduce((sum, d) => sum + d.weight, 0);
    const weightedSum = assessedDimensions.reduce((sum, d) => sum + d.score * d.weight, 0);
    compositeScore = Math.min(100, Math.max(0, Math.round(weightedSum / totalWeight)));
  }

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
 * Returns the most recently computed readiness score, or computes one
 * on-the-fly if none exists yet for this student.
 */
export async function getLatestReadinessScore(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  let latest = await prisma.readinessScore.findFirst({
    where: { profileId: profile.id },
    orderBy: { computedAt: "desc" },
  });

  if (!latest) {
    latest = await computeReadinessScore(userId);
  }

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

function extractPortfolioScore(analysisJson: any): number {
  if (analysisJson && typeof analysisJson === 'object' && typeof analysisJson.score === 'number') {
    return analysisJson.score;
  }
  return 0;
}

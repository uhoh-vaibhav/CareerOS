import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

/**
 * Get the latest learning roadmap for this student (from the most recent
 * skill gap analysis).
 */
export async function getLatestRoadmap(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      skillGapReports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { roadmap: true },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  const latestReport = profile.skillGapReports[0];
  if (!latestReport?.roadmap) {
    return null;
  }

  return {
    id: latestReport.roadmap.id,
    targetRole: latestReport.targetRole,
    missingSkills: latestReport.missingSkills,
    milestones: latestReport.roadmap.milestones,
    progressPct: latestReport.roadmap.progressPct,
    createdAt: latestReport.createdAt,
  };
}

/**
 * List all roadmaps for this student (history), most recent first.
 */
export async function listRoadmaps(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      skillGapReports: {
        orderBy: { createdAt: "desc" },
        include: { roadmap: true },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  return profile.skillGapReports
    .filter((r) => r.roadmap)
    .map((r) => ({
      id: r.roadmap!.id,
      targetRole: r.targetRole,
      missingSkills: r.missingSkills,
      milestones: r.roadmap!.milestones,
      progressPct: r.roadmap!.progressPct,
      createdAt: r.createdAt,
    }));
}

/**
 * Update the progress percentage on a specific roadmap.
 */
export async function updateRoadmapProgress(
  userId: string,
  roadmapId: string,
  progressPct: number
) {
  // Verify ownership
  const roadmap = await prisma.learningRoadmap.findUnique({
    where: { id: roadmapId },
    include: { report: { include: { profile: true } } },
  });

  if (!roadmap || roadmap.report.profile.userId !== userId) {
    throw new ApiError(404, "Roadmap not found");
  }

  return prisma.learningRoadmap.update({
    where: { id: roadmapId },
    data: { progressPct: Math.max(0, Math.min(progressPct, 100)) },
  });
}

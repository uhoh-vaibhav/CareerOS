import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
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
  progressPct: number,
  completedSteps?: (number | string)[]
) {
  // Verify ownership
  const roadmap = await prisma.learningRoadmap.findUnique({
    where: { id: roadmapId },
    include: { report: { include: { profile: true } } },
  });

  if (!roadmap || roadmap.report.profile.userId !== userId) {
    throw new ApiError(404, "Roadmap not found");
  }

  let updatedMilestones = roadmap.milestones;
  if (completedSteps && Array.isArray(roadmap.milestones)) {
    updatedMilestones = (roadmap.milestones as any[]).map((m, pIdx) => {
      // Legacy flat steps
      const isCompletedLegacy = completedSteps.includes(pIdx) || completedSteps.includes(String(pIdx));
      
      // If it's a new "Phase" containing subtasks
      let updatedSubtasks = m.subtasks;
      if (Array.isArray(m.subtasks)) {
        updatedSubtasks = m.subtasks.map((st: any, stIdx: number) => {
          const stId = `${pIdx}-${stIdx}`;
          return {
            ...st,
            isCompleted: completedSteps.includes(stId)
          };
        });
      }
      
      return {
        ...m,
        isCompleted: isCompletedLegacy,
        subtasks: updatedSubtasks
      };
    });
  }

  return prisma.learningRoadmap.update({
    where: { id: roadmapId },
    data: { 
      progressPct: Math.max(0, Math.min(progressPct, 100)),
      ...(completedSteps ? { milestones: updatedMilestones as any } : {})
    },
  });
}

export async function generateStudyMaterial(
  userId: string,
  roadmapId: string,
  phaseIdx: number,
  subtaskIdx: number,
  forceRegenerate: boolean = false
) {
  const roadmap = await prisma.learningRoadmap.findUnique({
    where: { id: roadmapId },
    include: { report: { include: { profile: true } } },
  });

  if (!roadmap || roadmap.report.profile.userId !== userId) {
    throw new ApiError(404, "Roadmap not found");
  }

  const milestones: any = Array.isArray(roadmap.milestones) ? roadmap.milestones : [];
  const phase = milestones[phaseIdx];
  if (!phase || !Array.isArray(phase.subtasks)) throw new ApiError(400, "Invalid phase or subtasks not found");
  const subtask = phase.subtasks[subtaskIdx];
  if (!subtask) throw new ApiError(400, "Invalid subtask index");

  // Check cache
  if (subtask.generatedMaterial && !forceRegenerate) {
    return subtask.generatedMaterial;
  }

  // Call AI Service
  let aiRes: Response;
  try {
    aiRes = await fetch(`${env.aiServiceUrl}/skill-gap/study-material`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_role: roadmap.report.targetRole,
        phase_title: phase.title,
        milestone_title: subtask.title,
        milestone_description: subtask.description || "",
        skills: subtask.skills || []
      })
    });
  } catch (e) {
    throw new ApiError(502, "AI Service unavailable");
  }

  if (!aiRes.ok) {
    throw new ApiError(502, "Failed to generate material");
  }

  const data = (await aiRes.json()) as { material: any };
  
  // Cache the material
  subtask.generatedMaterial = data.material;
  
  await prisma.learningRoadmap.update({
    where: { id: roadmapId },
    data: { milestones: milestones }
  });

  return data.material;
}

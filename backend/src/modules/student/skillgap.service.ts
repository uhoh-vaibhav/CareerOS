import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

interface AiSkillGapResult {
  missing_skills: string[];
  roadmap: string;
}

/**
 * SKL-01/02/03: compares the skills from the student's most recent resume
 * against a target role, via the AI service, and persists both the gap
 * report and the generated roadmap.
 *
 * Deliberately does NOT accept current_skills from the client — it always
 * derives them from the latest parsed resume, so a Skill Gap report is
 * always grounded in real, already-analyzed data rather than whatever the
 * client happens to send.
 */
export async function analyzeSkillGap(userId: string, targetRole: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { resumes: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  const latestResume = profile.resumes[0];
  if (!latestResume) {
    throw new ApiError(400, "Upload a resume before running a skill gap analysis");
  }

  const parsed = latestResume.parsedJson as { skills?: string[] } | null;
  const currentSkills = parsed?.skills ?? [];

  const aiResult = await callAiSkillGapService(profile.id, currentSkills, targetRole);

  // Parse the roadmap string into structured milestones.
  let milestones: Record<string, unknown>[];
  try {
    const parsed = JSON.parse(aiResult.roadmap);
    milestones = Array.isArray(parsed) ? parsed : [{ step: 1, title: "General Learning", description: aiResult.roadmap, skills: [], resources: [], estimatedWeeks: 4 }];
  } catch {
    milestones = [{ step: 1, title: "General Learning", description: aiResult.roadmap, skills: [], resources: [], estimatedWeeks: 4 }];
  }

  const report = await prisma.skillGapReport.create({
    data: {
      profileId: profile.id,
      targetRole,
      missingSkills: aiResult.missing_skills,
      roadmap: {
        create: {
          milestones: milestones as any,
          progressPct: 0,
        },
      },
    },
    include: { roadmap: true },
  });

  return { report, currentSkills };
}

async function callAiSkillGapService(
  profileId: string,
  currentSkills: string[],
  targetRole: string
): Promise<AiSkillGapResult> {
  const res = await fetch(`${env.aiServiceUrl}/skill-gap/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: profileId, current_skills: currentSkills, target_role: targetRole }),
  });

  if (!res.ok) {
    throw new ApiError(502, "The AI service failed to analyze the skill gap");
  }

  return res.json() as Promise<AiSkillGapResult>;
}

export async function listSkillGapReports(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { skillGapReports: { include: { roadmap: true }, orderBy: { createdAt: "desc" } } },
  });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }
  return profile.skillGapReports;
}

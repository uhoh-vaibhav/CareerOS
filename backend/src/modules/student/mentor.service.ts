import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

interface AiMentorResult {
  reply: string;
  retrieved_context: string[];
}

/**
 * MEN-01/02/03: sends a message to the AI Mentor's RAG pipeline (AI service),
 * then persists a summary of the exchange as a MentorSession row.
 *
 * The AI service itself writes the actual embedding into the vector store
 * (Career Memory) — this row is just the relational-side record of that
 * exchange having happened, for the student's session history view.
 */
export async function sendMentorMessage(userId: string, message: string) {
  const profile = await prisma.studentProfile.findUnique({ 
    where: { userId },
    include: {
      resumes: { orderBy: { createdAt: "desc" }, take: 1 },
      skillGapReports: { orderBy: { createdAt: "desc" }, take: 1, include: { roadmap: true } },
      mockInterviews: { orderBy: { createdAt: "desc" }, take: 1 },
      portfolio: true,
      readinessScores: { orderBy: { computedAt: "desc" }, take: 1 }
    }
  });
  
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  // Construct comprehensive career context
  const careerContext: Record<string, any> = {};

  const latestResume = profile.resumes[0];
  const detectedSkills = (profile.skills as string[]) || (latestResume?.parsedJson as any)?.skills || [];
  if (detectedSkills.length > 0) {
    careerContext.detectedSkills = detectedSkills;
  }
  
  const latestReport = profile.skillGapReports[0];
  const targetRole = profile.targetRole || latestReport?.targetRole;
  if (targetRole) {
    careerContext.targetRole = targetRole;
  }

  if (latestReport) {
    const rawMissing = latestReport.missingSkills as any;
    let missingSkillNames: string[] = [];
    if (Array.isArray(rawMissing)) {
      missingSkillNames = rawMissing.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean);
    } else if (rawMissing && Array.isArray(rawMissing.missingSkills)) {
      missingSkillNames = rawMissing.missingSkills.map((s: any) => (typeof s === "string" ? s : s?.name)).filter(Boolean);
    }
    if (missingSkillNames.length > 0) {
      careerContext.missingSkills = missingSkillNames;
    }
    
    if (latestReport.roadmap) {
      let currentMilestone: any = null;
      const rawMilestones = latestReport.roadmap.milestones;
      if (Array.isArray(rawMilestones)) {
        const milestones = rawMilestones as any[];
        for (const phase of milestones) {
          if (phase && Array.isArray(phase.subtasks)) {
            const pendingSubtask = phase.subtasks.find((st: any) => !st.isCompleted);
            if (pendingSubtask) {
              currentMilestone = {
                phase: phase.title || "Phase",
                milestone: pendingSubtask.title,
                description: pendingSubtask.description || ""
              };
              break;
            }
          } else if (phase && !phase.isCompleted) {
            currentMilestone = {
              phase: phase.title || "Step",
              milestone: phase.title || "Milestone",
              description: phase.description || ""
            };
            break;
          }
        }
      }

      careerContext.roadmap = {
        progressPct: latestReport.roadmap.progressPct,
        currentMilestone
      };
    }
  }
  
  const latestInterview = profile.mockInterviews[0];
  if (latestInterview) {
    careerContext.latestInterview = {
      score: latestInterview.score,
      role: latestInterview.role
    };
  }

  if (profile.portfolio) {
    careerContext.portfolio = {
      githubUsername: profile.portfolio.githubUsername,
      score: (profile.portfolio.analysisJson as any)?.score ?? 0
    };
  }

  const latestScore = profile.readinessScores[0];
  if (latestScore) {
    careerContext.readinessScore = latestScore.compositeScore;
  }

  const aiResult = await callAiMentorService(profile.id, message, careerContext);

  const session = await prisma.mentorSession.create({
    data: {
      profileId: profile.id,
      summary: `Q: ${message}
A: ${aiResult.reply}`,
      vectorRefId: profile.id,
    },
  });

  return { session, reply: aiResult.reply, retrievedContext: aiResult.retrieved_context };
}

async function callAiMentorService(profileId: string, message: string, careerContext?: any): Promise<AiMentorResult> {
  let res: Response;
  try {
    res = await fetch(`${env.aiServiceUrl}/mentor/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile_id: profileId, message, career_context: careerContext }),
    });
  } catch (e) {
    throw new ApiError(502, "The AI Mentor is temporarily unavailable (service unreachable)");
  }

  if (!res.ok) {
    throw new ApiError(502, "The AI Mentor is temporarily unavailable");
  }

  return res.json() as Promise<AiMentorResult>;
}

export async function listMentorSessions(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { mentorSessions: { orderBy: { createdAt: "asc" } } },
  });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }
  return profile.mentorSessions;
}
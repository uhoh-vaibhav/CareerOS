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
      skillGapReports: { orderBy: { createdAt: "desc" }, take: 1, include: { roadmap: true } },
      readinessScores: { orderBy: { computedAt: "desc" }, take: 1 }
    }
  });
  
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  // Construct context
  let careerContext: any = {};
  
  const latestReport = profile.skillGapReports[0];
  if (latestReport) {
    careerContext.targetRole = latestReport.targetRole;
    careerContext.missingSkills = latestReport.missingSkills;
    
    if (latestReport.roadmap) {
      careerContext.roadmap = {
        progressPct: latestReport.roadmap.progressPct,
        milestones: latestReport.roadmap.milestones
      };
    }
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
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";
import { computeReadinessScore } from "./readiness.service";

interface QuestionAnswer {
  question: string;
  answer: string;
}

export async function generateMockQuestions(userId: string, targetRole: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  
  let student_context = "";
  if (profile?.skills) {
    student_context = `Skills: ${JSON.stringify(profile.skills)}`;
  }

  let res: Response;
  try {
    res = await fetch(`${env.aiServiceUrl}/mock-interview/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        target_role: targetRole,
        student_context: student_context || undefined 
      }),
    });
  } catch (e) {
    throw new ApiError(502, "AI service unreachable for mock interview generation.");
  }

  if (!res.ok) {
    throw new ApiError(502, "AI service failed to generate questions.");
  }
  return res.json();
}

export async function evaluateMockInterview(userId: string, targetRole: string, qaPairs: QuestionAnswer[]) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Student profile not found");

  let res: Response;
  try {
    res = await fetch(`${env.aiServiceUrl}/mock-interview/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_role: targetRole, qa_pairs: qaPairs }),
    });
  } catch (e) {
    throw new ApiError(502, "AI service unreachable for mock interview evaluation.");
  }

  if (!res.ok) {
    throw new ApiError(502, "AI service failed to evaluate answers.");
  }
  
  const aiResult = (await res.json()) as any;

  const interview = await prisma.mockInterview.create({
    data: {
      profileId: profile.id,
      role: targetRole,
      feedback: { 
        qa: qaPairs as any, 
        feedback: aiResult.feedback,
        confidenceScore: aiResult.confidence_score,
        communicationFeedback: aiResult.communication_feedback
      } as any,
      score: aiResult.score,
    },
  });

  // Automatically refresh career readiness score
  await computeReadinessScore(userId).catch(() => {});

  return interview;
}

export async function listMockInterviews(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { mockInterviews: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) throw new ApiError(404, "Student profile not found");
  
  return profile.mockInterviews;
}

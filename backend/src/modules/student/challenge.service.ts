import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

export async function getDailyChallenge(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { skillGapReports: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!profile) throw new ApiError(404, "Profile not found");

  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  let challenge = await prisma.dailyChallenge.findUnique({
    where: { profileId_date: { profileId: profile.id, date: today } },
  });

  if (!challenge) {
    // Generate new
    const targetRole = profile.targetRole || "Software Engineer";
    const focusSkills = profile.skillGapReports[0]?.missingSkills || ["General Programming"];

    let res: Response;
    try {
      res = await fetch(`${env.aiServiceUrl}/daily-challenge/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_role: targetRole, focus_skills: focusSkills }),
      });
    } catch (e) {
      throw new ApiError(502, "AI service unreachable.");
    }

    if (!res.ok) throw new ApiError(502, "AI service failed to generate challenge.");
    const aiResult = (await res.json()) as any;

    challenge = await prisma.dailyChallenge.create({
      data: {
        profileId: profile.id,
        date: today,
        questions: aiResult.questions || [],
      },
    });
  }

  // Strip answers if not completed
  if (!challenge.isCompleted) {
    const strippedQuestions = (challenge.questions as any[]).map(q => ({
      question: q.question,
      options: q.options,
    }));
    return { ...challenge, questions: strippedQuestions };
  }

  return challenge;
}

export async function submitDailyChallenge(userId: string, answers: number[]) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Profile not found");

  const today = new Date().toISOString().split("T")[0];
  const challenge = await prisma.dailyChallenge.findUnique({
    where: { profileId_date: { profileId: profile.id, date: today } },
  });

  if (!challenge) throw new ApiError(404, "Challenge not found for today.");
  if (challenge.isCompleted) throw new ApiError(400, "Challenge already completed.");

  let score = 0;
  const questions = challenge.questions as any[];
  questions.forEach((q, i) => {
    if (answers[i] === q.correct_answer_index) score++;
  });

  const updated = await prisma.dailyChallenge.update({
    where: { id: challenge.id },
    data: { score, isCompleted: true },
  });

  return updated;
}

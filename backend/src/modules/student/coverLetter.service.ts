import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

export async function generateCoverLetter(userId: string, jobDescription: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: {
        include: {
          resumes: { orderBy: { createdAt: "desc" }, take: 1 },
          portfolio: true,
        },
      },
    },
  });

  if (!user || !user.profile) throw new ApiError(404, "Profile not found");

  // Construct Context
  let context = `Name: ${user.name || "Student"}\nTarget Role: ${user.profile.targetRole || "Unknown"}\n`;
  if (user.profile.skills) {
    context += `Skills: ${JSON.stringify(user.profile.skills)}\n`;
  }
  if (user.profile.portfolio?.analysisJson) {
    const p = user.profile.portfolio.analysisJson as any;
    if (p.strengths) context += `GitHub Strengths: ${p.strengths.join(", ")}\n`;
  }

  let res: Response;
  try {
    res = await fetch(`${env.aiServiceUrl}/cover-letter/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_description: jobDescription, student_context: context }),
    });
  } catch (e) {
    throw new ApiError(502, "AI service unreachable.");
  }

  if (!res.ok) throw new ApiError(502, "AI service failed to generate cover letter.");
  const aiResult = (await res.json()) as any;

  const coverLetter = await prisma.coverLetter.create({
    data: {
      profileId: user.profile.id,
      jobDescription,
      content: aiResult.cover_letter,
    },
  });

  return coverLetter;
}

export async function listCoverLetters(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { coverLetters: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) throw new ApiError(404, "Profile not found");
  return profile.coverLetters;
}

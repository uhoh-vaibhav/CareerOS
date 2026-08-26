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
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  const aiResult = await callAiMentorService(profile.id, message);

  const session = await prisma.mentorSession.create({
    data: {
      profileId: profile.id,
      summary: `Q: ${message}\nA: ${aiResult.reply}`,
      // The AI service keys Career Memory by profile.id under the hood;
      // there's no separate id returned yet to store here precisely.
      // TODO: have the AI service return the vector item id so this can
      // point at the exact embedding instead of just the profile's collection.
      vectorRefId: profile.id,
    },
  });

  return { session, reply: aiResult.reply, retrievedContext: aiResult.retrieved_context };
}

async function callAiMentorService(profileId: string, message: string): Promise<AiMentorResult> {
  const res = await fetch(`${env.aiServiceUrl}/mentor/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile_id: profileId, message }),
  });

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
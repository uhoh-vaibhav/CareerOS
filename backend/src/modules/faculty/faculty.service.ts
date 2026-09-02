import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

export async function listStudents() {
  const profiles = await prisma.studentProfile.findMany({
    include: {
      user: { select: { email: true } },
      readinessScores: {
        orderBy: { computedAt: "desc" },
        take: 1,
        select: { compositeScore: true },
      },
      _count: {
        select: { resumes: true, skillGapReports: true, mentorSessions: true },
      },
    },
  });

  return profiles.map((p) => ({
    profileId: p.id,
    email: p.user.email,
    readinessScore: p.readinessScores[0]?.compositeScore ?? null,
    resumeCount: p._count.resumes,
    skillGapReportCount: p._count.skillGapReports,
    mentorSessionCount: p._count.mentorSessions,
  }));
}

export async function getStudentDetail(profileId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { id: profileId },
    include: {
      user: { select: { email: true, createdAt: true } },
      resumes: {
        orderBy: { createdAt: "desc" },
        select: { id: true, atsScore: true, createdAt: true },
      },
      skillGapReports: {
        orderBy: { createdAt: "desc" },
        include: { roadmap: true },
      },
      mentorSessions: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, summary: true, createdAt: true },
      },
      readinessScores: {
        orderBy: { computedAt: "desc" },
        take: 10,
        select: { compositeScore: true, breakdown: true, computedAt: true },
      },
    },
  });

  if (!profile) {
    throw new ApiError(404, "Student profile not found");
  }

  return profile;
}

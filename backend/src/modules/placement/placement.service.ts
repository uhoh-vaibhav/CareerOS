import { prisma } from "../../lib/prisma";

export async function getPlacementOverview() {
  const [totalStudents, studentsWithResume, hiredCount, readinessScores] =
    await Promise.all([
      prisma.studentProfile.count(),
      prisma.studentProfile.count({
        where: { resumes: { some: {} } },
      }),
      prisma.application.count({ where: { status: "HIRED" } }),
      prisma.readinessScore.findMany({
        distinct: ["profileId"],
        orderBy: { computedAt: "desc" },
        select: { compositeScore: true },
      }),
    ]);

  const avgReadinessScore =
    readinessScores.length > 0
      ? Math.round(
          readinessScores.reduce((sum, s) => sum + s.compositeScore, 0) /
            readinessScores.length
        )
      : 0;

  return {
    totalStudents,
    avgReadinessScore,
    studentsWithResume,
    studentsPlaced: hiredCount,
  };
}

export async function listStudentReadiness() {
  const profiles = await prisma.studentProfile.findMany({
    include: {
      user: { select: { email: true } },
      readinessScores: {
        orderBy: { computedAt: "desc" },
        take: 1,
        select: { compositeScore: true, computedAt: true },
      },
      skillGapReports: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { targetRole: true },
      },
    },
    orderBy: { userId: "asc" },
  });

  return profiles.map((p) => ({
    profileId: p.id,
    email: p.user.email,
    targetRole: p.skillGapReports[0]?.targetRole ?? null,
    readinessScore: p.readinessScores[0]?.compositeScore ?? null,
    lastComputed: p.readinessScores[0]?.computedAt ?? null,
  }));
}

export async function getPlacementDriveStats() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { applications: true } },
      applications: {
        select: { status: true },
      },
    },
  });

  return jobs.map((j) => ({
    id: j.id,
    title: j.title,
    status: j.status,
    totalApplications: j._count.applications,
    hired: j.applications.filter((a) => a.status === "HIRED").length,
    shortlisted: j.applications.filter((a) => a.status === "SHORTLISTED").length,
    createdAt: j.createdAt,
  }));
}

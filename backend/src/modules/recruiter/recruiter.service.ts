import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { JobStatus } from "@prisma/client";

export async function createJobPosting(
  userId: string,
  data: { title: string; requiredSkills: string[] }
) {
  return prisma.jobPosting.create({
    data: {
      recruiterUserId: userId,
      title: data.title,
      requiredSkills: data.requiredSkills,
    },
  });
}

export async function listMyJobPostings(userId: string) {
  return prisma.jobPosting.findMany({
    where: { recruiterUserId: userId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { applications: true } } },
  });
}

export async function getJobApplications(userId: string, jobId: string) {
  // Verify the job belongs to this recruiter
  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job || job.recruiterUserId !== userId) {
    throw new ApiError(404, "Job posting not found");
  }

  return prisma.application.findMany({
    where: { jobId },
    orderBy: { aiRankScore: { sort: "desc", nulls: "last" } },
    include: {
      profile: {
        include: {
          user: { select: { email: true } },
        },
      },
    },
  });
}

export async function updateJobStatus(
  userId: string,
  jobId: string,
  status: JobStatus
) {
  const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
  if (!job || job.recruiterUserId !== userId) {
    throw new ApiError(404, "Job posting not found");
  }

  return prisma.jobPosting.update({
    where: { id: jobId },
    data: { status },
  });
}

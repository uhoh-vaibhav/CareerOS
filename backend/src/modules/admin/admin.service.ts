import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { Role } from "@prisma/client";

export async function getStats() {
  const [totalUsers, totalResumes, totalJobPostings, roleCounts] = await Promise.all([
    prisma.user.count(),
    prisma.resume.count(),
    prisma.jobPosting.count(),
    prisma.user.groupBy({ by: ["role"], _count: { role: true } }),
  ]);

  const byRole: Record<string, number> = {};
  for (const r of roleCounts) {
    byRole[r.role] = r._count.role;
  }

  return { totalUsers, byRole, totalResumes, totalJobPostings };
}

export async function listUsers(roleFilter?: string) {
  const where = roleFilter ? { role: roleFilter as Role } : {};
  return prisma.user.findMany({
    where,
    select: { id: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function changeUserRole(userId: string, newRole: Role) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // If changing to STUDENT, ensure a StudentProfile exists
  if (newRole === Role.STUDENT) {
    const existing = await prisma.studentProfile.findUnique({ where: { userId } });
    if (!existing) {
      await prisma.studentProfile.create({ data: { userId } });
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return updated;
}

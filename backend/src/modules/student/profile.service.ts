import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || !user.profile) throw new ApiError(404, "Profile not found");

  return {
    name: user.name,
    email: user.email,
    education: user.profile.education,
    targetRole: user.profile.targetRole,
  };
}

export async function updateProfile(userId: string, data: { name?: string, education?: string, targetRole?: string }) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  });
  if (!user || !user.profile) throw new ApiError(404, "Profile not found");

  const [updatedUser, updatedProfile] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { name: data.name },
    }),
    prisma.studentProfile.update({
      where: { id: user.profile.id },
      data: { education: data.education, targetRole: data.targetRole },
    })
  ]);

  return {
    name: updatedUser.name,
    email: updatedUser.email,
    education: updatedProfile.education,
    targetRole: updatedProfile.targetRole,
  };
}

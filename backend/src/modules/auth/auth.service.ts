import { prisma } from "../../lib/prisma";
import { hashPassword, comparePassword } from "../../utils/password";
import { signToken } from "../../utils/jwt";
import { ApiError } from "../../middleware/errorHandler";
import { Role } from "@prisma/client";

interface RegisterInput {
  email: string;
  password: string;
  role?: Role;
}

interface LoginInput {
  email: string;
  password: string;
}

export async function registerUser({ email, password, role = Role.STUDENT }: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      profile: role === Role.STUDENT ? { create: {} } : undefined,
    },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

export async function loginUser({ email, password }: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = signToken({ sub: user.id, role: user.role });
  return { token, user: toPublicUser(user) };
}

function toPublicUser(user: { id: string; email: string; role: Role; createdAt: Date }) {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}

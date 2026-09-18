import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerUser, loginUser } from "./auth.service";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";

const loginSchema = z.object({
  email: z.string().email().transform(e => e.toLowerCase().trim()),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.cookie("token", result.token, COOKIE_OPTIONS);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.cookie("token", result.token, COOKIE_OPTIONS);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict"
    });
    res.status(200).json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new ApiError(401, "Not authenticated");
    const user = await prisma.user.findUnique({
      where: { id: req.user.sub },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    if (!user) throw new ApiError(404, "User not found");
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

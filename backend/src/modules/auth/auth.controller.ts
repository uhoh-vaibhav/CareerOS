import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { registerUser, loginUser } from "./auth.service";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const registerSchema = credentialsSchema.extend({
  role: z.enum(['STUDENT', 'RECRUITER', 'PLACEMENT_OFFICER', 'FACULTY', 'ADMIN']).optional(),
});

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const result = await registerUser(input);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = credentialsSchema.parse(req.body);
    const result = await loginUser(input);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  res.status(200).json({ user: req.user });
}

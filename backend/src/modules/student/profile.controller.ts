import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getProfile, updateProfile } from "./profile.service";

const updateSchema = z.object({
  name: z.string().optional(),
  education: z.string().optional(),
  targetRole: z.string().optional(),
});

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await getProfile(userId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const data = updateSchema.parse(req.body);
    const result = await updateProfile(userId, data);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

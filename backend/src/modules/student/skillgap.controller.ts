import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { analyzeSkillGap, listSkillGapReports } from "./skillgap.service";

const analyzeSchema = z.object({
  target_role: z.string().min(2, "Target role is required"),
});

export async function analyze(req: Request, res: Response, next: NextFunction) {
  try {
    const { target_role } = analyzeSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await analyzeSkillGap(userId, target_role);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const reports = await listSkillGapReports(userId);
    res.status(200).json({ reports });
  } catch (err) {
    next(err);
  }
}

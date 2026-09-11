import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getLatestRoadmap, listRoadmaps, updateRoadmapProgress, generateStudyMaterial } from "./roadmap.service";

export async function latest(req: Request, res: Response, next: NextFunction) {
  try {
    const roadmap = await getLatestRoadmap(req.user!.sub);
    res.status(200).json({ roadmap });
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const roadmaps = await listRoadmaps(req.user!.sub);
    res.status(200).json({ roadmaps });
  } catch (err) {
    next(err);
  }
}

const progressSchema = z.object({
  progressPct: z.number().min(0).max(100),
  completedSteps: z.array(z.union([z.number(), z.string()])).optional(),
});

const materialSchema = z.object({
  phaseIdx: z.number().int().min(0),
  subtaskIdx: z.number().int().min(0),
  forceRegenerate: z.boolean().optional().default(false),
});

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { progressPct, completedSteps } = progressSchema.parse(req.body);
    const roadmap = await updateRoadmapProgress(req.user!.sub, req.params.id, progressPct, completedSteps);
    res.status(200).json({ roadmap });
  } catch (err) {
    next(err);
  }
}

export async function generateMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const { phaseIdx, subtaskIdx, forceRegenerate } = materialSchema.parse(req.body);
    const material = await generateStudyMaterial(req.user!.sub, req.params.id, phaseIdx, subtaskIdx, forceRegenerate);
    res.status(200).json({ material });
  } catch (err) {
    next(err);
  }
}

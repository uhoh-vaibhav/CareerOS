import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getLatestRoadmap, listRoadmaps, updateRoadmapProgress } from "./roadmap.service";

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
});

export async function updateProgress(req: Request, res: Response, next: NextFunction) {
  try {
    const { progressPct } = progressSchema.parse(req.body);
    const roadmap = await updateRoadmapProgress(req.user!.sub, req.params.id, progressPct);
    res.status(200).json({ roadmap });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import {
  computeReadinessScore,
  getLatestReadinessScore,
  getReadinessHistory,
} from "./readiness.service";

/**
 * POST /api/v1/student/readiness
 * Recalculates the readiness score from current data and persists it.
 */
export async function compute(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const score = await computeReadinessScore(userId);
    res.status(201).json({ score });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/student/readiness
 * Returns the most recently computed readiness score.
 */
export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const score = await getLatestReadinessScore(userId);
    res.status(200).json({ score });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/student/readiness/history
 * Returns all past readiness scores for the trend chart.
 */
export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const scores = await getReadinessHistory(userId);
    res.status(200).json({ history: scores });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import {
  getPlacementOverview,
  listStudentReadiness,
  getPlacementDriveStats,
} from "./placement.service";

export async function overview(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPlacementOverview();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function students(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listStudentReadiness();
    res.status(200).json({ students: data });
  } catch (err) {
    next(err);
  }
}

export async function drives(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getPlacementDriveStats();
    res.status(200).json({ drives: data });
  } catch (err) {
    next(err);
  }
}

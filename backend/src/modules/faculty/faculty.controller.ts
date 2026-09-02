import { Request, Response, NextFunction } from "express";
import { listStudents, getStudentDetail } from "./faculty.service";

export async function students(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await listStudents();
    res.status(200).json({ students: data });
  } catch (err) {
    next(err);
  }
}

export async function studentDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStudentDetail(req.params.profileId);
    res.status(200).json({ student: data });
  } catch (err) {
    next(err);
  }
}

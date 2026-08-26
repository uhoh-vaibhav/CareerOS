import { Request, Response, NextFunction } from "express";
import { uploadAndParseResume, listResumes } from "./resume.service";
import { ApiError } from "../../middleware/errorHandler";

export async function upload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      throw new ApiError(400, "No file uploaded — attach it under the 'resume' field");
    }
    const userId = req.user!.sub;
    const result = await uploadAndParseResume(userId, {
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      originalname: req.file.originalname,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const resumes = await listResumes(userId);
    res.status(200).json({ resumes });
  } catch (err) {
    next(err);
  }
}

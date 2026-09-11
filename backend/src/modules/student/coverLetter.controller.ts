import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateCoverLetter, listCoverLetters } from "./coverLetter.service";

const generateSchema = z.object({
  jobDescription: z.string().min(10, "Job description is too short"),
});

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const { jobDescription } = generateSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await generateCoverLetter(userId, jobDescription);
    res.status(201).json({ coverLetter: result });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await listCoverLetters(userId);
    res.status(200).json({ coverLetters: result });
  } catch (err) {
    next(err);
  }
}

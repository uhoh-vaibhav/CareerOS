import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateMockQuestions, evaluateMockInterview, listMockInterviews } from "./mockInterview.service";

const generateSchema = z.object({
  target_role: z.string().min(2, "Target role is required"),
});

const evaluateSchema = z.object({
  target_role: z.string().min(2, "Target role is required"),
  qa_pairs: z.array(z.object({
    question: z.string(),
    answer: z.string()
  }))
});

export async function generate(req: Request, res: Response, next: NextFunction) {
  try {
    const { target_role } = generateSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await generateMockQuestions(userId, target_role);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

export async function evaluate(req: Request, res: Response, next: NextFunction) {
  try {
    const { target_role, qa_pairs } = evaluateSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await evaluateMockInterview(userId, target_role, qa_pairs);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await listMockInterviews(userId);
    res.status(200).json({ interviews: result });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getDailyChallenge, submitDailyChallenge } from "./challenge.service";

const submitSchema = z.object({
  answers: z.array(z.number()),
});

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await getDailyChallenge(userId);
    res.status(200).json({ challenge: result });
  } catch (err) {
    next(err);
  }
}

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const { answers } = submitSchema.parse(req.body);
    const result = await submitDailyChallenge(userId, answers);
    res.status(200).json({ challenge: result });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { sendMentorMessage, listMentorSessions } from "./mentor.service";

const messageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message is too long"),
});

export async function sendMessage(req: Request, res: Response, next: NextFunction) {
  try {
    const { message } = messageSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await sendMentorMessage(userId, message);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function history(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const sessions = await listMentorSessions(userId);
    res.status(200).json({ sessions });
  } catch (err) {
    next(err);
  }
}
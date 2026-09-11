import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { linkAndAnalyzePortfolio, getPortfolio } from "./portfolio.service";

const linkSchema = z.object({
  github_username: z.string().min(1, "GitHub username is required"),
});

export async function link(req: Request, res: Response, next: NextFunction) {
  try {
    const { github_username } = linkSchema.parse(req.body);
    const userId = req.user!.sub;
    const result = await linkAndAnalyzePortfolio(userId, github_username);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await getPortfolio(userId);
    res.status(200).json({ portfolio: result });
  } catch (err) {
    next(err);
  }
}

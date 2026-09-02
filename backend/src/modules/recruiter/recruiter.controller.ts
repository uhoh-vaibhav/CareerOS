import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  createJobPosting,
  listMyJobPostings,
  getJobApplications,
  updateJobStatus,
} from "./recruiter.service";

const createSchema = z.object({
  title: z.string().min(2, "Job title is required"),
  requiredSkills: z.array(z.string()).min(1, "At least one skill is required"),
});

const statusSchema = z.object({
  status: z.enum(["OPEN", "CLOSED"]),
});

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const data = createSchema.parse(req.body);
    const job = await createJobPosting(req.user!.sub, data);
    res.status(201).json({ job });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const jobs = await listMyJobPostings(req.user!.sub);
    res.status(200).json({ jobs });
  } catch (err) {
    next(err);
  }
}

export async function applications(req: Request, res: Response, next: NextFunction) {
  try {
    const apps = await getJobApplications(req.user!.sub, req.params.id);
    res.status(200).json({ applications: apps });
  } catch (err) {
    next(err);
  }
}

export async function patchStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = statusSchema.parse(req.body);
    const job = await updateJobStatus(req.user!.sub, req.params.id, status);
    res.status(200).json({ job });
  } catch (err) {
    next(err);
  }
}

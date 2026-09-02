import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { create, list, applications, patchStatus } from "./recruiter.controller";

export const recruiterRouter = Router();

recruiterRouter.post("/", requireAuth, requireRole("RECRUITER"), create);
recruiterRouter.get("/", requireAuth, requireRole("RECRUITER"), list);
recruiterRouter.get("/:id/applications", requireAuth, requireRole("RECRUITER"), applications);
recruiterRouter.patch("/:id/status", requireAuth, requireRole("RECRUITER"), patchStatus);

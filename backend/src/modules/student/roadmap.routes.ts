import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { latest, history, updateProgress } from "./roadmap.controller";

export const roadmapRouter = Router();

roadmapRouter.get("/", requireAuth, requireRole("STUDENT"), latest);
roadmapRouter.get("/history", requireAuth, requireRole("STUDENT"), history);
roadmapRouter.patch("/:id/progress", requireAuth, requireRole("STUDENT"), updateProgress);

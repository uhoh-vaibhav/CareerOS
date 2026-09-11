import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { generate, evaluate, list } from "./mockInterview.controller";

export const mockInterviewRouter = Router();

mockInterviewRouter.post("/generate", requireAuth, requireRole("STUDENT"), generate);
mockInterviewRouter.post("/evaluate", requireAuth, requireRole("STUDENT"), evaluate);
mockInterviewRouter.get("/", requireAuth, requireRole("STUDENT"), list);

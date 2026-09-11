import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { generate, list } from "./coverLetter.controller";

export const coverLetterRouter = Router();

coverLetterRouter.use(requireAuth, requireRole("STUDENT"));
coverLetterRouter.post("/generate", generate);
coverLetterRouter.get("/", list);

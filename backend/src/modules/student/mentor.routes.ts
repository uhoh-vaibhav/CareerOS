import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { sendMessage, history } from "./mentor.controller";

export const mentorRouter = Router();

// MEN-01/02/03 — any authenticated Student can chat with their own AI Mentor.
mentorRouter.post("/", requireAuth, requireRole("STUDENT"), sendMessage);
mentorRouter.get("/", requireAuth, requireRole("STUDENT"), history);
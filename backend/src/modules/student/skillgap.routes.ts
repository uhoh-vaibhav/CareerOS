import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { analyze, list } from "./skillgap.controller";

export const skillGapRouter = Router();

// SKL-01/02/03 — any authenticated Student can analyze/view their own skill gap reports.
skillGapRouter.post("/", requireAuth, requireRole("STUDENT"), analyze);
skillGapRouter.get("/", requireAuth, requireRole("STUDENT"), list);

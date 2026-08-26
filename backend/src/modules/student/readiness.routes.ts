import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { compute, get, history } from "./readiness.controller";

export const readinessRouter = Router();

// PORT-04 — Readiness Score: any authenticated Student can compute/view their score.
readinessRouter.post("/", requireAuth, requireRole("STUDENT"), compute);
readinessRouter.get("/", requireAuth, requireRole("STUDENT"), get);
readinessRouter.get("/history", requireAuth, requireRole("STUDENT"), history);

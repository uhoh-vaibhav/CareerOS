import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { overview, students, drives } from "./placement.controller";

export const placementRouter = Router();

placementRouter.get("/", requireAuth, requireRole("PLACEMENT_OFFICER"), overview);
placementRouter.get("/students", requireAuth, requireRole("PLACEMENT_OFFICER"), students);
placementRouter.get("/drives", requireAuth, requireRole("PLACEMENT_OFFICER"), drives);

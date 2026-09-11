import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { get, update } from "./profile.controller";

export const profileRouter = Router();

profileRouter.get("/", requireAuth, requireRole("STUDENT"), get);
profileRouter.patch("/", requireAuth, requireRole("STUDENT"), update);

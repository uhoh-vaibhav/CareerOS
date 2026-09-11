import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { link, get } from "./portfolio.controller";

export const portfolioRouter = Router();

portfolioRouter.post("/link", requireAuth, requireRole("STUDENT"), link);
portfolioRouter.get("/", requireAuth, requireRole("STUDENT"), get);

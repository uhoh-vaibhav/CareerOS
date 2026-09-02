import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { stats, users, changeRole } from "./admin.controller";

export const adminRouter = Router();

// All admin routes require ADMIN role.
adminRouter.get("/", requireAuth, requireRole("ADMIN"), stats);
adminRouter.get("/users", requireAuth, requireRole("ADMIN"), users);
adminRouter.patch("/users/:id/role", requireAuth, requireRole("ADMIN"), changeRole);

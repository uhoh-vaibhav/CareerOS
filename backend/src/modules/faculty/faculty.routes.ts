import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { students, studentDetail } from "./faculty.controller";

export const facultyRouter = Router();

facultyRouter.get("/students", requireAuth, requireRole("FACULTY"), students);
facultyRouter.get("/students/:profileId", requireAuth, requireRole("FACULTY"), studentDetail);

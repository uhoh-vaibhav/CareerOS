import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { get, submit } from "./challenge.controller";

export const challengeRouter = Router();

challengeRouter.use(requireAuth, requireRole("STUDENT"));
challengeRouter.get("/", get);
challengeRouter.post("/submit", submit);

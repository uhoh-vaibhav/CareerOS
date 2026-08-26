import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { upload as uploadHandler, list } from "./resume.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const resumeRouter = Router();

// STU-02/03/04 — any authenticated Student can upload/view their own resumes.
resumeRouter.post(
  "/",
  requireAuth,
  requireRole("STUDENT"),
  upload.single("resume"),
  uploadHandler
);
resumeRouter.get("/", requireAuth, requireRole("STUDENT"), list);

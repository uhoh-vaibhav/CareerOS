import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";

import { env } from "./config/env";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { adminRouter } from "./modules/admin/admin.routes";

import { resumeRouter } from "./modules/student/resume.routes";
import { skillGapRouter } from "./modules/student/skillgap.routes";
import { mentorRouter } from "./modules/student/mentor.routes";
import { readinessRouter } from "./modules/student/readiness.routes";
import { roadmapRouter } from "./modules/student/roadmap.routes";
import { mockInterviewRouter } from "./modules/student/mockInterview.routes";
import { portfolioRouter } from "./modules/student/portfolio.routes";
import { certificateRouter } from "./modules/student/certificate.routes";
import { profileRouter } from "./modules/student/profile.routes";
import { coverLetterRouter } from "./modules/student/coverLetter.routes";
import { challengeRouter } from "./modules/student/challenge.routes";
import { errorHandler } from "./middleware/errorHandler";
import { recruiterRouter } from "./modules/recruiter/recruiter.routes";
import { placementRouter } from "./modules/placement/placement.routes";
import { facultyRouter } from "./modules/faculty/faculty.routes";

export function createApp() {
  const app = express();

  app.use(helmet({ 
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    frameguard: false,
    contentSecurityPolicy: false
  }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use("/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/student/resume", resumeRouter);
  app.use("/api/v1/student/skill-gap", skillGapRouter);
  app.use("/api/v1/student/mentor", mentorRouter);
  app.use("/api/v1/student/readiness", readinessRouter);
  app.use("/api/v1/student/roadmap", roadmapRouter);
  app.use("/api/v1/student/mock-interview", mockInterviewRouter);
  app.use("/api/v1/student/portfolio", portfolioRouter);
  app.use("/api/v1/student/certificates", certificateRouter);
  app.use("/api/v1/student/profile", profileRouter);
  app.use("/api/v1/student/cover-letter", coverLetterRouter);
  app.use("/api/v1/student/daily-challenge", challengeRouter);
  app.use("/api/v1/recruiter", recruiterRouter);
  app.use("/api/v1/placement", placementRouter);
  app.use("/api/v1/faculty", facultyRouter);

  // 404 catch-all
  app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // Centralized error handler (handles ZodError, ApiError, etc.)
  app.use(errorHandler);

  return app;
}

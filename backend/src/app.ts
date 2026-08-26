import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { healthRouter } from "./modules/health/health.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { adminRouter } from "./modules/admin/admin.routes";
import { resumeRouter } from "./modules/student/resume.routes";
import { skillGapRouter } from "./modules/student/skillgap.routes";
import { mentorRouter } from "./modules/student/mentor.routes";
import { readinessRouter } from "./modules/student/readiness.routes";

export function createApp() {
  const app = express();

  // helmet's default cross-origin-resource-policy blocks the frontend from
  // loading files served below — relax it for this dev-only static route.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  // Dev-only local file storage for uploaded resumes (see resume.service.ts).
  // Replace with a signed URL from S3/Cloud Storage before any real deployment.
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.use("/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/admin", adminRouter);
  app.use("/api/v1/student/resume", resumeRouter);
  app.use("/api/v1/student/skill-gap", skillGapRouter);
  app.use("/api/v1/student/mentor", mentorRouter);
  app.use("/api/v1/student/readiness", readinessRouter);
  // Additional module routers (recruiter, placement, faculty) get mounted
  // here following the same pattern.

  app.use(errorHandler);

  return app;
}
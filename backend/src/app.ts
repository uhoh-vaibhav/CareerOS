import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import cookieParser from "cookie-parser";

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
import { challengeRouter } from "./modules/student/challenge.routes";
import { errorHandler } from "./middleware/errorHandler";
import { recruiterRouter } from "./modules/recruiter/recruiter.routes";
import { placementRouter } from "./modules/placement/placement.routes";
import { facultyRouter } from "./modules/faculty/faculty.routes";

import rateLimit from "express-rate-limit";

export function createApp() {
  const app = express();

  // Basic Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Limit each IP to 500 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests from this IP, please try again later." }
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // Stricter limit for auth endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts, please try again later." }
  });

  // Enable all Helmet protections, customized for our CORS setup
  app.use(helmet({ 
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  const configuredOrigins = (env.corsOrigin || "").split(",").map(o => o.trim());
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        configuredOrigins.includes("*") ||
        configuredOrigins.includes(origin) ||
        origin.endsWith(".vercel.app") ||
        origin.includes("localhost")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === "development" ? "dev" : "combined"));

  // Serve uploaded files securely (prevent execution in browser)
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
    setHeaders: (res, path) => {
      res.setHeader("X-Content-Type-Options", "nosniff");
      // Prevent inline XSS if someone uploads an HTML file posing as a PDF/image
      res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    }
  }));

  // Apply general rate limit to all /api routes
  app.use("/api", apiLimiter);

  app.use("/health", healthRouter);
  app.use("/api/v1/auth", authLimiter, authRouter);
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

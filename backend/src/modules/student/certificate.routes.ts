import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { add, list, remove } from "./certificate.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export const certificateRouter = Router();

certificateRouter.post("/", requireAuth, requireRole("STUDENT"), upload.single("file"), add);
certificateRouter.get("/", requireAuth, requireRole("STUDENT"), list);
certificateRouter.delete("/:id", requireAuth, requireRole("STUDENT"), remove);

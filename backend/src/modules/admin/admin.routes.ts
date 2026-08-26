import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { requireRole } from "../../middleware/rbac";
import { prisma } from "../../lib/prisma";

export const adminRouter = Router();

adminRouter.get("/users", requireAuth, requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ users });
  } catch (err) {
    next(err);
  }
});

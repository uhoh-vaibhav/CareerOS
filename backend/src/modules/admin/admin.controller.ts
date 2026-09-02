import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { getStats, listUsers, changeUserRole } from "./admin.service";
import { Role } from "@prisma/client";

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getStats();
    res.status(200).json(data);
  } catch (err) {
    next(err);
  }
}

export async function users(req: Request, res: Response, next: NextFunction) {
  try {
    const role = req.query.role as string | undefined;
    const data = await listUsers(role);
    res.status(200).json({ users: data });
  } catch (err) {
    next(err);
  }
}

const changeRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export async function changeRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { role } = changeRoleSchema.parse(req.body);
    const user = await changeUserRole(req.params.id, role);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}

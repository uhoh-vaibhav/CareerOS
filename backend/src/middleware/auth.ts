import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/jwt";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token = req.cookies?.token;

  if (!token) {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      token = header.slice("Bearer ".length);
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Missing or malformed Authorization token" });
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

import { Router } from "express";
import { register, login, logout, me } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", requireAuth, logout);
authRouter.get("/me", requireAuth, me);

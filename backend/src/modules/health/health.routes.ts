import { Router } from "express";
import { env } from "../../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.status(200).json({ status: "ok", service: "careeros-backend", time: new Date().toISOString() });
});

healthRouter.get("/ai", async (_req, res) => {
  try {
    const aiHealthUrl = `${env.aiServiceUrl}/health`;
    const resp = await fetch(aiHealthUrl, { signal: AbortSignal.timeout(15000) });
    const data = await resp.json();
    return res.status(resp.status).json({
      configuredUrl: env.aiServiceUrl,
      aiStatus: resp.status,
      aiData: data
    });
  } catch (err: any) {
    return res.status(502).json({
      configuredUrl: env.aiServiceUrl,
      error: err?.message,
      hint: "Ensure AI_SERVICE_URL on Render is set to your public https://careeros-ai-xxxx.onrender.com URL."
    });
  }
});

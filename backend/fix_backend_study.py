# -*- coding: utf-8 -*-
with open("src/modules/student/roadmap.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

new_service = """
export async function generateStudyMaterial(
  userId: string,
  roadmapId: string,
  phaseIdx: number,
  subtaskIdx: number,
  forceRegenerate: boolean = false
) {
  const roadmap = await prisma.learningRoadmap.findUnique({
    where: { id: roadmapId },
    include: { report: { include: { profile: true } } },
  });

  if (!roadmap || roadmap.report.profile.userId !== userId) {
    throw new ApiError(404, "Roadmap not found");
  }

  const milestones: any = Array.isArray(roadmap.milestones) ? roadmap.milestones : [];
  const phase = milestones[phaseIdx];
  if (!phase || !Array.isArray(phase.subtasks)) throw new ApiError(400, "Invalid phase or subtasks not found");
  const subtask = phase.subtasks[subtaskIdx];
  if (!subtask) throw new ApiError(400, "Invalid subtask index");

  // Check cache
  if (subtask.generatedMaterial && !forceRegenerate) {
    return subtask.generatedMaterial;
  }

  // Call AI Service
  let aiRes: Response;
  try {
    aiRes = await fetch(`${env.aiServiceUrl}/skill-gap/study-material`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_role: roadmap.report.targetRole,
        phase_title: phase.title,
        milestone_title: subtask.title,
        milestone_description: subtask.description || "",
        skills: subtask.skills || []
      })
    });
  } catch (e) {
    throw new ApiError(502, "AI Service unavailable");
  }

  if (!aiRes.ok) {
    throw new ApiError(502, "Failed to generate material");
  }

  const data = (await aiRes.json()) as { material: any };
  
  // Cache the material
  subtask.generatedMaterial = data.material;
  
  await prisma.learningRoadmap.update({
    where: { id: roadmapId },
    data: { milestones: milestones }
  });

  return data.material;
}
"""

if "generateStudyMaterial" not in content:
    content += new_service
    with open("src/modules/student/roadmap.service.ts", "w", encoding="utf-8") as f:
        f.write(content)

with open("src/modules/student/roadmap.controller.ts", "r", encoding="utf-8") as f:
    content_c = f.read()

new_controller = """
export async function generateMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const { phaseIdx, subtaskIdx, forceRegenerate } = req.body;
    const material = await generateStudyMaterial(req.user!.sub, req.params.id, phaseIdx, subtaskIdx, forceRegenerate);
    res.status(200).json({ material });
  } catch (err) {
    next(err);
  }
}
"""

if "generateMaterial" not in content_c:
    content_c = content_c.replace(
        "export async function updateProgress",
        "import { generateStudyMaterial } from './roadmap.service';\n\nexport async function updateProgress"
    )
    content_c += new_controller
    with open("src/modules/student/roadmap.controller.ts", "w", encoding="utf-8") as f:
        f.write(content_c)

with open("src/modules/student/roadmap.routes.ts", "r", encoding="utf-8") as f:
    content_r = f.read()

if "/:id/material" not in content_r:
    content_r = content_r.replace(
        "getRoadmap, updateProgress } from",
        "getRoadmap, updateProgress, generateMaterial } from"
    )
    content_r += '\nroadmapRouter.post("/:id/material", requireAuth, requireRole("STUDENT"), generateMaterial);\n'
    with open("src/modules/student/roadmap.routes.ts", "w", encoding="utf-8") as f:
        f.write(content_r)

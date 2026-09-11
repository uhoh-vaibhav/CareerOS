with open("src/modules/student/roadmap.controller.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "completedSteps: z.array(z.number()).optional(),",
    "completedSteps: z.array(z.union([z.number(), z.string()])).optional(),"
)

with open("src/modules/student/roadmap.controller.ts", "w", encoding="utf-8") as f:
    f.write(content)

with open("src/modules/student/roadmap.service.ts", "r", encoding="utf-8") as f:
    content2 = f.read()

# Replace the update logic to handle nested subtasks if present
old_update = """  let updatedMilestones = roadmap.milestones;
  if (completedSteps && Array.isArray(roadmap.milestones)) {
    updatedMilestones = (roadmap.milestones as any[]).map((m, idx) => ({
      ...m,
      isCompleted: completedSteps.includes(idx),
    }));
  }"""

new_update = """  let updatedMilestones = roadmap.milestones;
  if (completedSteps && Array.isArray(roadmap.milestones)) {
    updatedMilestones = (roadmap.milestones as any[]).map((m, pIdx) => {
      // Legacy flat steps
      const isCompletedLegacy = completedSteps.includes(pIdx) || completedSteps.includes(String(pIdx));
      
      // If it's a new "Phase" containing subtasks
      let updatedSubtasks = m.subtasks;
      if (Array.isArray(m.subtasks)) {
        updatedSubtasks = m.subtasks.map((st: any, stIdx: number) => {
          const stId = `${pIdx}-${stIdx}`;
          return {
            ...st,
            isCompleted: completedSteps.includes(stId)
          };
        });
      }
      
      return {
        ...m,
        isCompleted: isCompletedLegacy,
        subtasks: updatedSubtasks
      };
    });
  }"""

content2 = content2.replace(old_update, new_update)
# Also change the signature `completedSteps?: number[]` to `completedSteps?: (number|string)[]`
content2 = content2.replace("completedSteps?: number[]", "completedSteps?: (number | string)[]")

with open("src/modules/student/roadmap.service.ts", "w", encoding="utf-8") as f:
    f.write(content2)

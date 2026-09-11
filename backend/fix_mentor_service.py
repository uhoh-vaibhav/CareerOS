with open("src/modules/student/mentor.service.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Update callAiMentorService signature
content = content.replace(
    "async function callAiMentorService(profileId: string, message: string)",
    "async function callAiMentorService(profileId: string, message: string, careerContext?: any)"
)

content = content.replace(
    "body: JSON.stringify({ profile_id: profileId, message }),",
    "body: JSON.stringify({ profile_id: profileId, message, career_context: careerContext }),"
)

new_send_message = """export async function sendMentorMessage(userId: string, message: string) {
  const profile = await prisma.studentProfile.findUnique({ 
    where: { userId },
    include: {
      skillGapReports: { orderBy: { createdAt: "desc" }, take: 1, include: { roadmap: true } },
      readinessScores: { orderBy: { computedAt: "desc" }, take: 1 }
    }
  });
  
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  // Construct context
  let careerContext: any = {};
  
  const latestReport = profile.skillGapReports[0];
  if (latestReport) {
    careerContext.targetRole = latestReport.targetRole;
    careerContext.missingSkills = latestReport.missingSkills;
    
    if (latestReport.roadmap) {
      careerContext.roadmap = {
        progressPct: latestReport.roadmap.progressPct,
        milestones: latestReport.roadmap.milestones
      };
    }
  }
  
  const latestScore = profile.readinessScores[0];
  if (latestScore) {
    careerContext.readinessScore = latestScore.compositeScore;
  }

  const aiResult = await callAiMentorService(profile.id, message, careerContext);

  const session = await prisma.mentorSession.create({
    data: {
      profileId: profile.id,
      summary: `Q: ${message}\\nA: ${aiResult.reply}`,
      vectorRefId: profile.id,
    },
  });

  return { session, reply: aiResult.reply, retrievedContext: aiResult.retrieved_context };
}"""

import re
content = re.sub(r'export async function sendMentorMessage\(userId: string, message: string\) \{.*?return \{ session, reply: aiResult\.reply, retrievedContext: aiResult\.retrieved_context \};\n\}', new_send_message, content, flags=re.DOTALL)

with open("src/modules/student/mentor.service.ts", "w", encoding="utf-8") as f:
    f.write(content)

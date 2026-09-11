import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

export async function linkAndAnalyzePortfolio(userId: string, githubUsername: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Student profile not found");

  // Fetch repos from GitHub (up to 30 public repos)
  let ghRes: Response;
  try {
    ghRes = await fetch(`https://api.github.com/users/${encodeURIComponent(githubUsername.trim())}/repos?sort=updated&per_page=30`, {
      headers: {
        "User-Agent": "CareerOS-Backend",
        "Accept": "application/vnd.github.v3+json",
      },
    });
  } catch (e) {
    throw new ApiError(502, "Failed to connect to GitHub API");
  }
  if (!ghRes.ok) {
    if (ghRes.status === 404) throw new ApiError(404, "GitHub user not found");
    throw new ApiError(502, "Failed to fetch repositories from GitHub");
  }
  
  const repos = (await ghRes.json()) as any[];
  const repoData = repos.map((r: any) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count
  }));

  // Analyze via AI Service
  const aiRes = await fetch(`${env.aiServiceUrl}/portfolio/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ github_username: githubUsername, repos: repoData }),
  });

  if (!aiRes.ok) {
    throw new ApiError(502, "AI service failed to analyze portfolio.");
  }
  
  const aiResult = (await aiRes.json()) as any;

  // Upsert the GitHubPortfolio
  const portfolio = await prisma.gitHubPortfolio.upsert({
    where: { profileId: profile.id },
    create: {
      profileId: profile.id,
      githubUsername,
      analysisJson: aiResult,
    },
    update: {
      githubUsername,
      analysisJson: aiResult,
    }
  });

  return portfolio;
}

export async function getPortfolio(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { portfolio: true },
  });
  if (!profile) throw new ApiError(404, "Student profile not found");
  
  return profile.portfolio;
}

import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { env } from "../../config/env";
import { ApiError } from "../../middleware/errorHandler";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

interface AiParseResult {
  skills: string[];
  ats_score: number;
  ats_breakdown: Record<string, number>;
  feedback: string;
}

/**
 * STU-02/03/04: accept a resume upload, extract its text, send it to the AI
 * service for parsing + ATS scoring, and persist the result.
 *
 * File storage here is local disk — fine for dev, swap for S3/Cloud Storage
 * before any real deployment (fileUrl already models this: it's just a
 * string, so the swap doesn't touch the schema).
 */
export async function uploadAndParseResume(userId: string, file: UploadedFile) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }

  if (!["application/pdf", "text/plain"].includes(file.mimetype)) {
    throw new ApiError(400, "Only PDF and plain text resumes are supported right now");
  }

  const resumeText = await extractText(file);
  if (!resumeText.trim()) {
    throw new ApiError(400, "Could not extract any text from the uploaded file");
  }

  const fileUrl = await saveFile(file);
  const parsed = await callAiParseService(resumeText);

  const resume = await prisma.resume.create({
    data: {
      profileId: profile.id,
      fileUrl,
      parsedJson: parsed as any,
      atsScore: parsed.ats_score,
    },
  });

  // Also save extracted skills to the student profile so skill-gap analysis
  // can display them as "current skills"
  await prisma.studentProfile.update({
    where: { id: profile.id },
    data: { skills: parsed.skills },
  });

  return { resume, parsed };
}

async function extractText(file: UploadedFile): Promise<string> {
  if (file.mimetype === "text/plain") {
    return file.buffer.toString("utf-8");
  }

  // application/pdf — pdf-parse is CommonJS, handle both import styles
  const pdfParseModule = await import("pdf-parse");
  const pdfParse = (pdfParseModule as any).default || pdfParseModule;
  try {
    const data = await pdfParse(file.buffer);
    return data.text;
  } catch (err) {
    throw new ApiError(400, "Failed to parse PDF document. It may be corrupted or password protected.");
  }
}

async function saveFile(file: UploadedFile): Promise<string> {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const ext = file.mimetype === "application/pdf" ? "pdf" : "txt";
  const filename = `${randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
  return `/uploads/resumes/${filename}`;
}

async function callAiParseService(resumeText: string): Promise<AiParseResult> {
  let res: Response;
  try {
    res = await fetch(`${env.aiServiceUrl}/resume/parse`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume_text: resumeText }),
    });
  } catch (e) {
    throw new ApiError(502, "AI service is unreachable");
  }

  if (!res.ok) {
    let detail = "The AI service failed to parse this resume";
    try {
      const body = (await res.json()) as any;
      if (body.detail) detail = `AI service error: ${body.detail}`;
    } catch (_) {}
    throw new ApiError(502, detail);
  }

  return res.json() as Promise<AiParseResult>;
}

export async function listResumes(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { resumes: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) {
    throw new ApiError(404, "Student profile not found for this user");
  }
  return profile.resumes;
}

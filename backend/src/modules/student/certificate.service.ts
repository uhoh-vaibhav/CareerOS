import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../middleware/errorHandler";
import { validateFileSignature } from "../../utils/fileSecurity";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "certificates");

interface UploadedFile {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
}

export async function addCertificate(userId: string, title: string, issuer?: string, file?: UploadedFile) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Student profile not found");

  let fileUrl = null;
  if (file) {
    // Whitelist allowed file types to prevent Stored XSS
    const allowedMimes = ["application/pdf", "image/jpeg", "image/png"];
    const allowedExts = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
    
    if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
      throw new ApiError(400, "Only PDF, JPEG, and PNG files are allowed");
    }

    // Phase 4: Verify magic numbers to ensure they match the mimetype
    validateFileSignature(file.buffer, file.mimetype);

    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const filename = `${randomUUID()}${ext}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.buffer);
    fileUrl = `/uploads/certificates/${filename}`;
  }

  const certificate = await prisma.certificate.create({
    data: {
      profileId: profile.id,
      title,
      issuer,
      fileUrl,
    },
  });

  return certificate;
}

export async function listCertificates(userId: string) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: { certificates: { orderBy: { createdAt: "desc" } } },
  });
  if (!profile) throw new ApiError(404, "Student profile not found");
  
  return profile.certificates;
}

export async function deleteCertificate(userId: string, certId: string) {
  const profile = await prisma.studentProfile.findUnique({ where: { userId } });
  if (!profile) throw new ApiError(404, "Student profile not found");

  const cert = await prisma.certificate.findFirst({
    where: { id: certId, profileId: profile.id },
  });
  if (!cert) throw new ApiError(404, "Certificate not found or does not belong to you");

  await prisma.certificate.delete({ where: { id: certId } });

  // Optionally delete file from disk, but for this project leaving it is fine.
  return { success: true };
}

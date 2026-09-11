import { Request, Response, NextFunction } from "express";
import { addCertificate, listCertificates, deleteCertificate } from "./certificate.service";
import { ApiError } from "../../middleware/errorHandler";

export async function add(req: Request, res: Response, next: NextFunction) {
  try {
    const { title, issuer } = req.body;
    if (!title) throw new ApiError(400, "Title is required");

    const userId = req.user!.sub;
    
    let fileObj = undefined;
    if (req.file) {
      fileObj = {
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
      };
    }

    const result = await addCertificate(userId, title, issuer, fileObj);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const result = await listCertificates(userId);
    res.status(200).json({ certificates: result });
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.sub;
    const certId = req.params.id;
    const result = await deleteCertificate(userId, certId);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

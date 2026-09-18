import { ApiError } from "../middleware/errorHandler";

/**
 * Validates the magic bytes (file signature) of an uploaded file buffer against its expected mimetype.
 * This prevents users from uploading an executable file renamed to .pdf or .png.
 * 
 * Supported mimetypes: application/pdf, image/jpeg, image/png, text/plain
 */
export function validateFileSignature(buffer: Buffer, mimetype: string): void {
  // We need at least 4 bytes to verify most signatures safely
  if (!buffer || buffer.length < 4) {
    throw new ApiError(400, "File is empty or corrupted");
  }

  // Convert first 4 bytes to a hex string for easy comparison
  const hex = buffer.toString('hex', 0, 4).toUpperCase();

  switch (mimetype) {
    case "application/pdf":
      // PDF signature: %PDF (25 50 44 46)
      if (hex !== "25504446") {
        throw new ApiError(400, "Invalid file signature. File is not a valid PDF.");
      }
      break;

    case "image/jpeg":
    case "image/jpg":
      // JPEG signature: FF D8 FF
      if (!hex.startsWith("FFD8FF")) {
        throw new ApiError(400, "Invalid file signature. File is not a valid JPEG.");
      }
      break;

    case "image/png":
      // PNG signature: 89 50 4E 47
      if (hex !== "89504E47") {
        throw new ApiError(400, "Invalid file signature. File is not a valid PNG.");
      }
      break;

    case "text/plain":
      // Text files don't have a strict magic number, but they shouldn't start with common binary magic numbers like MZ (executables), PK (zips), etc.
      // Easiest is to ensure it's mostly printable characters or just not an obvious binary signature.
      // MZ (DOS MZ executable): 4D 5A
      // ELF (Linux executable): 7F 45 4C 46
      // Mach-O (Mac executable): FE ED FA CE, FE ED FA CF, CE FA ED FE, CF FA ED FE
      if (hex.startsWith("4D5A") || hex === "7F454C46" || hex.startsWith("FEED") || hex.startsWith("CEFA") || hex.startsWith("CFFA")) {
         throw new ApiError(400, "Invalid file signature. Executables are not permitted as text files.");
      }
      break;

    default:
      // If we don't explicitly support checking this mimetype yet, throw an error
      // to force us to write a handler, preventing bypass.
      throw new ApiError(400, `File signature validation not implemented for mimetype: ${mimetype}`);
  }
}

import multer from "multer";
import { AppError } from "../../errors/app-error.js";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png", "text/plain"]);

export const supportAttachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_request, file, callback) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new AppError(400, "UNSUPPORTED_ATTACHMENT", "Attach a PDF, PNG, JPG, or TXT file."));
      return;
    }
    callback(null, true);
  },
}).single("attachment");

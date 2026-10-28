import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireRoles } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate-body.js";
import * as adminController from "./admin.controller.js";
import { adminMessageSchema, internalNoteSchema, updateTicketSchema } from "./admin.schemas.js";

export const adminRouter = Router();

adminRouter.use(authenticate, requireRoles("ADMIN"));
const responseDraftRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many AI draft requests. Try again later." },
      requestId: response.locals.requestId,
    });
  },
});
adminRouter.get("/authors", adminController.listAuthors);
adminRouter.get("/authors/:authorId", adminController.getAuthor);
adminRouter.get("/books", adminController.listBooks);
adminRouter.get("/books/:bookId", adminController.getBook);
adminRouter.get("/tickets", adminController.listTicketQueue);
adminRouter.get("/tickets/:ticketId", adminController.getTicket);
adminRouter.patch("/tickets/:ticketId", validateBody(updateTicketSchema), adminController.updateTicket);
adminRouter.post("/tickets/:ticketId/assign", adminController.assignTicketToSelf);
adminRouter.post("/tickets/:ticketId/notes", validateBody(internalNoteSchema), adminController.createInternalNote);
adminRouter.post("/tickets/:ticketId/messages", validateBody(adminMessageSchema), adminController.sendAdminMessage);
adminRouter.post("/tickets/:ticketId/ai-draft", responseDraftRateLimit, adminController.createResponseDraft);
adminRouter.get("/tickets/:ticketId/attachments/:attachmentId", adminController.downloadAttachment);

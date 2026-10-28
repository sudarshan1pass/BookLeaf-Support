import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate, requireRoles } from "../../middleware/authenticate.js";
import { validateBody } from "../../middleware/validate-body.js";
import * as authorController from "./author.controller.js";
import { createMessageSchema, createTicketSchema } from "./author.schemas.js";
import { supportAttachmentUpload } from "../support/upload-middleware.js";

export const authorRouter = Router();

authorRouter.use(authenticate, requireRoles("AUTHOR"));
const ticketSubmissionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 15,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many support queries were submitted. Try again later." },
      requestId: response.locals.requestId,
    });
  },
});
authorRouter.get("/dashboard", authorController.dashboard);
authorRouter.get("/profile", authorController.profile);
authorRouter.get("/books", authorController.listBooks);
authorRouter.get("/books/:bookId", authorController.getBook);
authorRouter.get("/tickets", authorController.listTickets);
authorRouter.post("/tickets", ticketSubmissionRateLimit, supportAttachmentUpload, validateBody(createTicketSchema), authorController.createTicket);
authorRouter.get("/tickets/:ticketId", authorController.getTicket);
authorRouter.post("/tickets/:ticketId/messages", validateBody(createMessageSchema), authorController.replyToTicket);
authorRouter.get("/tickets/:ticketId/attachments/:attachmentId", authorController.downloadAttachment);

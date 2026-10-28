export type Role = "USER" | "AUTHOR" | "ADMIN";
export type BookStatus = "DRAFT" | "IN_REVIEW" | "PUBLISHED";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "WAITING_ON_AUTHOR" | "RESOLVED" | "CLOSED";
export type TicketCategory =
  | "ROYALTY_AND_PAYMENTS"
  | "ISBN_AND_METADATA_ISSUES"
  | "PRINTING_AND_QUALITY"
  | "DISTRIBUTION_AND_AVAILABILITY"
  | "BOOK_STATUS_AND_PRODUCTION_UPDATES"
  | "GENERAL_INQUIRY";
export type TicketPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type Author = { id: string; fullName: string; email: string };
export type Book = {
  id: string;
  title: string;
  subtitle: string | null;
  genre: string | null;
  description: string | null;
  status: BookStatus;
  isbn: string | null;
  createdAt: string;
  updatedAt: string;
};
export type Attachment = {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  downloadUrl: string;
};
export type TicketMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; fullName: string; role: Role };
  attachments: Attachment[];
};
export type Ticket = {
  id: string;
  subject: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  _count?: { messages: number };
};

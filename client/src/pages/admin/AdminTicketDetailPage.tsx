import { ArrowDownToLine, ArrowLeft, Bot, Check, MessageCircle, Send, UserRound, StickyNote } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState, PageHeading, TicketStatusBadge } from "../../components/ui";
import { useApiData } from "../../hooks/useApiData";
import { ApiError, apiRequest, downloadFile } from "../../lib/api";
import type { Attachment, Role, TicketCategory, TicketPriority, TicketStatus } from "../../types";

type AdminMessage = {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; fullName: string; role: Role };
  attachments: Attachment[];
};
type InternalNote = {
  id: string;
  body: string;
  createdAt: string;
  admin: { id: string; fullName: string };
};
type TicketDetails = {
  id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string; email: string };
  assignedAdmin: { id: string; fullName: string } | null;
  messages: AdminMessage[];
  internalNotes: InternalNote[];
};

const categories: TicketCategory[] = ["ROYALTY_AND_PAYMENTS", "ISBN_AND_METADATA_ISSUES", "PRINTING_AND_QUALITY", "DISTRIBUTION_AND_AVAILABILITY", "BOOK_STATUS_AND_PRODUCTION_UPDATES", "GENERAL_INQUIRY"];
const priorities: TicketPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_AUTHOR", "RESOLVED", "CLOSED"];

function label(value: string) {
  return value.split("_").map((part) => part[0] + part.slice(1).toLowerCase()).join(" ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export function AdminTicketDetailPage() {
  const { ticketId = "" } = useParams();
  const path = "/api/admin/tickets/" + encodeURIComponent(ticketId);
  const { data, error, loading, reload } = useApiData<{ ticket: TicketDetails }>(path);
  const [reply, setReply] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [status, setStatus] = useState<TicketStatus>("OPEN");
  const [category, setCategory] = useState<TicketCategory>("GENERAL_INQUIRY");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");

  useEffect(() => {
    if (!data) return;
    setStatus(data.ticket.status);
    setCategory(data.ticket.category);
    setPriority(data.ticket.priority);
  }, [data]);

  async function updateTicket(values: Partial<{ status: TicketStatus; category: TicketCategory; priority: TicketPriority }>) {
    setBusy("update");
    try {
      await apiRequest<{ ticket: TicketDetails }>(path, { method: "PATCH", body: JSON.stringify(values) });
      toast.success("Ticket updated.");
      reload();
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "Ticket update failed.");
    } finally {
      setBusy("");
    }
  }

  async function assignToSelf() {
    setBusy("assign");
    try {
      await apiRequest<{ ticket: TicketDetails }>(path + "/assign", { method: "POST" });
      toast.success("Ticket assigned to you.");
      reload();
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "Could not assign ticket.");
    } finally {
      setBusy("");
    }
  }

  async function generateDraft() {
    setBusy("draft");
    try {
      const result = await apiRequest<{ draft: string; knowledgeBaseConfigured: boolean }>(path + "/ai-draft", { method: "POST" });
      setReply(result.draft);
      toast.success(result.knowledgeBaseConfigured ? "AI draft ready to review." : "Draft ready. Configure the BookLeaf Knowledge Base for policy specific guidance.");
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "AI draft is unavailable. Write a response manually.");
    } finally {
      setBusy("");
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("reply");
    try {
      await apiRequest<{ ticket: TicketDetails }>(path + "/messages", { method: "POST", body: JSON.stringify({ message: reply }) });
      setReply("");
      toast.success("Response sent to the author.");
      reload();
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "The response could not be sent.");
    } finally {
      setBusy("");
    }
  }

  async function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("note");
    try {
      await apiRequest<{ note: InternalNote }>(path + "/notes", { method: "POST", body: JSON.stringify({ body: note }) });
      setNote("");
      toast.success("Internal note added.");
      reload();
    } catch (reason) {
      toast.error(reason instanceof ApiError ? reason.message : "The internal note could not be added.");
    } finally {
      setBusy("");
    }
  }

  if (loading) return <LoadingState label="Loading ticket details…" />;
  if (error || !data) return <ErrorState message={error ?? "The requested ticket could not be loaded."} onRetry={reload} />;

  const ticket = data.ticket;
  return (
    <>
      <Link to="/tickets" className="back-link mb-6"><ArrowLeft size={15} />Back to queue</Link>
      <PageHeading eyebrow="Ticket details" title={ticket.subject} description={"Opened by " + ticket.author.fullName + " · " + formatDate(ticket.createdAt)} action={<TicketStatusBadge status={ticket.status} />} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-5">
          <section className="panel overflow-hidden">
            <div className="flex items-center gap-2 border-b border-[#edf0ec] px-5 py-4 md:px-7"><MessageCircle size={17} className="text-[#63816a]" /><h2 className="text-sm font-semibold text-[#384a3d]">Conversation</h2><span className="ml-auto text-xs text-[#929d95]">{ticket.messages.length} messages</span></div>
            <div className="space-y-6 px-5 py-6 md:px-7 md:py-8">
              {ticket.messages.map((message) => {
                const authorMessage = message.sender.role === "AUTHOR";
                return <article key={message.id} className={"flex gap-3 " + (authorMessage ? "" : "flex-row-reverse")}>
                  <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold " + (authorMessage ? "bg-[#dceade] text-[#42684a]" : "bg-[#e8edf6] text-[#536a98]")}>{authorMessage ? "AU" : "BL"}</span>
                  <div className={"min-w-0 max-w-[88%] " + (authorMessage ? "" : "text-right")}>
                    <div className={"mb-1.5 flex flex-wrap items-center gap-2 " + (authorMessage ? "" : "justify-end")}><span className="text-xs font-semibold text-[#4b5c50]">{message.sender.fullName}</span><span className="text-[10px] text-[#a0aaa2]">{formatDate(message.createdAt)}</span></div>
                    <div className={"inline-block rounded-2xl px-4 py-3 text-left text-sm leading-6 " + (authorMessage ? "rounded-tl-sm bg-[#f3f5f2] text-[#536057]" : "rounded-tr-sm bg-[#eaf3e9] text-[#455b49]")}><p className="whitespace-pre-wrap break-words">{message.body}</p></div>
                    {message.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{message.attachments.map((attachment) => <button key={attachment.id} className="attachment-chip" onClick={() => void downloadFile(attachment.downloadUrl, attachment.originalName).catch(() => toast.error("Attachment download failed."))}><ArrowDownToLine size={14} />{attachment.originalName}</button>)}</div>}
                  </div>
                </article>;
              })}
            </div>
          </section>
          <section className="panel p-5 md:p-7">
            <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold text-[#384a3d]">Public response</h2><p className="mt-1 text-xs text-[#89958c]">The author will see this message.</p></div><button className="button-secondary" type="button" disabled={busy !== ""} onClick={() => void generateDraft()}><Bot size={15} />{busy === "draft" ? "Generating…" : "AI draft"}</button></div>
            <form onSubmit={sendReply}>
              <textarea className="field-input min-h-36 resize-y py-3 leading-6" value={reply} onChange={(event) => setReply(event.target.value)} minLength={1} maxLength={5000} required placeholder="Write or edit a response to the author…" />
              <div className="mt-3 flex justify-end"><button disabled={busy !== ""} className="button-primary disabled:opacity-60" type="submit">{busy === "reply" ? "Sending…" : "Send response"}<Send size={14} /></button></div>
            </form>
          </section>
          <section className="panel p-5 md:p-7">
            <div className="mb-4 flex items-center gap-2"><StickyNote size={16} className="text-[#9b7c45]" /><h2 className="text-sm font-semibold text-[#384a3d]">Internal notes</h2><span className="text-[10px] text-[#a1a99f]">Visible to admins only</span></div>
            <div className="mb-5 space-y-3">
              {ticket.internalNotes.length === 0 ? <p className="text-xs text-[#929d95]">No internal notes yet.</p> : ticket.internalNotes.map((item) => <article key={item.id} className="rounded-xl border border-[#f0e7d4] bg-[#fffcf4] p-3"><div className="flex justify-between gap-3 text-[10px] text-[#9b8a66]"><span>{item.admin.fullName}</span><span>{formatDate(item.createdAt)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#62583f]">{item.body}</p></article>)}
            </div>
            <form onSubmit={addNote}>
              <textarea className="field-input min-h-24 resize-y py-3 leading-6" value={note} onChange={(event) => setNote(event.target.value)} minLength={1} maxLength={5000} required placeholder="Add a private note for the support team…" />
              <div className="mt-3 flex justify-end"><button className="button-secondary" disabled={busy !== ""} type="submit">{busy === "note" ? "Adding…" : "Add internal note"}<Check size={14} /></button></div>
            </form>
          </section>
        </div>
        <aside className="space-y-5">
          <section className="panel p-5">
            <h2 className="mb-5 text-sm font-semibold text-[#384a3d]">Ticket controls</h2>
            <div className="space-y-4">
              <label className="form-label w-full flex-col">Status<select className="field-input mt-1.5" value={status} disabled={busy !== ""} onChange={(event) => { const value = event.target.value as TicketStatus; setStatus(value); void updateTicket({ status: value }); }}>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
              <label className="form-label w-full flex-col">Category<select className="field-input mt-1.5" value={category} disabled={busy !== ""} onChange={(event) => { const value = event.target.value as TicketCategory; setCategory(value); void updateTicket({ category: value }); }}>{categories.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
              <label className="form-label w-full flex-col">Priority<select className="field-input mt-1.5" value={priority} disabled={busy !== ""} onChange={(event) => { const value = event.target.value as TicketPriority; setPriority(value); void updateTicket({ priority: value }); }}>{priorities.map((value) => <option key={value} value={value}>{label(value)}</option>)}</select></label>
              <div className="rounded-xl bg-[#f7f9f6] p-3">
                <p className="detail-label">Assigned admin</p><p className="mt-1.5 text-sm text-[#4d5f52]">{ticket.assignedAdmin?.fullName ?? "Unassigned"}</p>
                <button className="button-secondary mt-3 w-full" disabled={busy !== ""} onClick={() => void assignToSelf()}><UserRound size={14} />{busy === "assign" ? "Assigning…" : "Assign ticket to me"}</button>
              </div>
            </div>
          </section>
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold text-[#384a3d]">Author</h2>
            <p className="text-sm font-medium text-[#4d5f52]">{ticket.author.fullName}</p>
            <p className="mt-1 break-all text-xs text-[#829087]">{ticket.author.email}</p>
            <div className="mt-5 border-t border-[#edf0ec] pt-4"><p className="detail-label">Opened</p><p className="mt-1.5 text-xs text-[#58675d]">{formatDate(ticket.createdAt)}</p><p className="detail-label mt-4">Ticket ID</p><p className="mt-1.5 break-all font-mono text-[10px] text-[#58675d]">{ticket.id}</p></div>
          </section>
        </aside>
      </div>
    </>
  );
}

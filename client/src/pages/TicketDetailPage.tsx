import { ArrowDownToLine, ArrowLeft, Clock3, MessageCircle, Send } from "lucide-react";
import { useState, type FormEvent, type MouseEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, LoadingState, PageHeading, TicketStatusBadge } from "../components/ui";
import { useApiData } from "../hooks/useApiData";
import { ApiError, apiRequest, downloadFile } from "../lib/api";
import type { Attachment, Ticket as SupportTicket, TicketMessage } from "../types";

type TicketDetails = SupportTicket & { messages: TicketMessage[] };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function AttachmentLink({ attachment }: { attachment: Attachment }) {
  const [error, setError] = useState<string | null>(null);
  async function handleDownload(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setError(null);
    try {
      await downloadFile(attachment.downloadUrl, attachment.originalName);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Download failed.");
    }
  }
  return <span className="inline-flex flex-col items-start"><button className="attachment-chip" onClick={handleDownload}><ArrowDownToLine size={14} /><span className="max-w-52 truncate">{attachment.originalName}</span><span className="text-[10px] text-[#929d95]">{(attachment.sizeBytes / 1024).toFixed(0)} KB</span></button>{error && <span className="mt-1 text-[11px] text-[#a85d50]">{error}</span>}</span>;
}

export function TicketDetailPage() {
  const { ticketId = "" } = useParams();
  const path = `/api/author/tickets/${encodeURIComponent(ticketId)}`;
  const { data, error, loading, reload } = useApiData<{ ticket: TicketDetails }>(path);
  const [reply, setReply] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setReplyError(null);
    try {
      await apiRequest<{ ticket: TicketDetails }>(`${path}/messages`, { method: "POST", body: JSON.stringify({ message: reply }) });
      setReply("");
      reload();
    } catch (reason) {
      setReplyError(reason instanceof ApiError ? reason.message : "We couldn’t send your reply. Please try again.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <LoadingState label="Loading your conversation…" />;
  if (error || !data) return <ErrorState message={error ?? "The requested ticket could not be loaded."} onRetry={reload} />;

  const { ticket } = data;
  return (
    <>
      <Link to="/tickets" className="back-link mb-6"><ArrowLeft size={15} />Back to My Tickets</Link>
      <PageHeading eyebrow="Support conversation" title={ticket.subject} description={`Opened ${formatDate(ticket.createdAt)}`} action={<TicketStatusBadge status={ticket.status} />} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="panel overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#edf0ec] px-5 py-4 md:px-7">
            <div className="flex items-center gap-2"><MessageCircle size={17} className="text-[#63816a]" /><h2 className="text-sm font-semibold text-[#384a3d]">Conversation</h2></div>
            <span className="text-xs text-[#929d95]">{ticket.messages.length} {ticket.messages.length === 1 ? "message" : "messages"}</span>
          </div>
          <div className="space-y-6 px-5 py-6 md:px-7 md:py-8">
            {ticket.messages.map((message) => {
              const isAuthor = message.sender.role === "AUTHOR";
              return (
                <article key={message.id} className={`flex gap-3 ${isAuthor ? "flex-row-reverse" : ""}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${isAuthor ? "bg-[#dceade] text-[#42684a]" : "bg-[#e8edf6] text-[#536a98]"}`}>
                    {isAuthor ? "YOU" : "BL"}
                  </span>
                  <div className={`min-w-0 max-w-[88%] ${isAuthor ? "text-right" : ""}`}>
                    <div className={`mb-1.5 flex flex-wrap items-center gap-2 ${isAuthor ? "justify-end" : ""}`}><span className="text-xs font-semibold text-[#4b5c50]">{isAuthor ? "You" : "BookLeaf Support"}</span><span className="text-[10px] text-[#a0aaa2]">{formatDate(message.createdAt)}</span></div>
                    <div className={`inline-block rounded-2xl px-4 py-3 text-left text-sm leading-6 ${isAuthor ? "rounded-tr-sm bg-[#eaf3e9] text-[#455b49]" : "rounded-tl-sm bg-[#f3f5f2] text-[#536057]"}`}>
                      <p className="whitespace-pre-wrap break-words">{message.body}</p>
                    </div>
                    {message.attachments.length > 0 && <div className={`mt-2 flex flex-wrap gap-2 ${isAuthor ? "justify-end" : ""}`}>{message.attachments.map((attachment) => <AttachmentLink key={attachment.id} attachment={attachment} />)}</div>}
                  </div>
                </article>
              );
            })}
          </div>
          <form onSubmit={sendReply} className="border-t border-[#edf0ec] bg-[#fcfdfb] p-5 md:px-7 md:py-6">
            <label className="form-label" htmlFor="reply">Reply to this ticket</label>
            <textarea id="reply" className="field-input mt-2 min-h-28 resize-y py-3 leading-6" value={reply} onChange={(event) => setReply(event.target.value)} minLength={1} maxLength={5000} required placeholder="Write a message to the support team…" />
            {replyError && <p role="alert" className="mt-3 text-sm text-[#a2574b]">{replyError}</p>}
            <div className="mt-3 flex items-center justify-between"><span className="text-[11px] text-[#9aa49c]">Replies are visible to you and the support team.</span><button disabled={sending} className="button-primary disabled:cursor-not-allowed disabled:opacity-60" type="submit">{sending ? "Sending…" : "Send reply"}<Send size={14} /></button></div>
          </form>
        </section>

        <aside>
          <section className="panel p-5">
            <h2 className="mb-5 text-sm font-semibold text-[#384a3d]">Ticket details</h2>
            <div className="space-y-5">
              <div><p className="detail-label">Status</p><div className="mt-2"><TicketStatusBadge status={ticket.status} /></div></div>
              <div><p className="detail-label">Ticket number</p><p className="mt-1.5 break-all font-mono text-xs text-[#58675d]">{ticket.id}</p></div>
              <div><p className="detail-label">Opened</p><p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#58675d]"><Clock3 size={13} />{formatDate(ticket.createdAt)}</p></div>
            </div>
          </section>
          <p className="mt-4 px-2 text-xs leading-5 text-[#98a29a]">You’ll see replies from our team here. You can add a message any time.</p>
        </aside>
      </div>
    </>
  );
}

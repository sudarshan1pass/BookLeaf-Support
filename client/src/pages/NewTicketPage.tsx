import { ArrowLeft, FileUp, Paperclip, Send, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiError, apiRequest } from "../lib/api";
import type { Ticket as SupportTicket } from "../types";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "text/plain"];

export function NewTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const relatedBook = searchParams.get("book");
  const [subject, setSubject] = useState(relatedBook ? `Question about ${relatedBook}`.slice(0, 200) : "");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function chooseFile(candidate?: File) {
    if (!candidate) return;
    if (!ACCEPTED_TYPES.includes(candidate.type)) {
      setError("Choose a PDF, PNG, JPG, or TXT file.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (candidate.size > MAX_FILE_BYTES) {
      setError("Attachments must be 5 MB or smaller.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setError(null);
    setFile(candidate);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const body = new FormData();
    body.append("subject", subject);
    body.append("message", message);
    if (file) body.append("attachment", file);

    try {
      const result = await apiRequest<{ ticket: SupportTicket }>("/api/author/tickets", { method: "POST", body });
      navigate(`/tickets/${result.ticket.id}`);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "We couldn’t send your query. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link to="/tickets" className="back-link mb-6"><ArrowLeft size={15} />Back to My Tickets</Link>
      <div className="mx-auto max-w-3xl">
        <div className="mb-7"><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#77917d]">Support</p><h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#21382d] md:text-[34px]">Submit a support query</h1><p className="mt-2 text-sm leading-6 text-[#77847c]">Tell us what you need help with. Our team will follow up in this ticket.</p></div>

        <form onSubmit={submit} className="panel p-5 md:p-8">
          <label className="form-label" htmlFor="subject">Subject<span className="text-[#b86d58]">*</span></label>
          <input id="subject" className="field-input mt-2" value={subject} onChange={(event) => setSubject(event.target.value)} minLength={5} maxLength={200} required placeholder="A short summary of your question" />

          <label className="form-label mt-6 block" htmlFor="message">How can we help?<span className="text-[#b86d58]">*</span></label>
          <textarea id="message" className="field-input mt-2 min-h-40 resize-y py-3 leading-6" value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={5000} required placeholder="Share some details so we can get you the right help…" />
          <p className="mt-1.5 text-right text-[11px] text-[#9aa49c]">{message.length}/5000</p>

          <div className="mt-5 rounded-2xl border border-dashed border-[#d9e1d8] bg-[#fafcf9] p-4 md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf3ea] text-[#5f805f]"><Paperclip size={17} /></span><div><p className="text-sm font-semibold text-[#445449]">Add an attachment <span className="font-normal text-[#929d95]">(optional)</span></p><p className="mt-1 text-xs text-[#909b93]">PDF, PNG, JPG or TXT · Up to 5 MB</p></div></div>
              <button type="button" className="button-secondary shrink-0" onClick={() => inputRef.current?.click()}><FileUp size={15} />Choose file</button>
              <input ref={inputRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.txt,application/pdf,image/png,image/jpeg,text/plain" onChange={(event) => chooseFile(event.target.files?.[0])} />
            </div>
            {file && <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e6ebe4] bg-white px-3.5 py-2.5"><span className="min-w-0"><span className="block truncate text-xs font-semibold text-[#4d5c51]">{file.name}</span><span className="text-[10px] text-[#96a098]">{(file.size / 1024).toFixed(0)} KB</span></span><button type="button" className="icon-button ml-3" aria-label="Remove attachment" onClick={() => { setFile(null); if (inputRef.current) inputRef.current.value = ""; }}><X size={15} /></button></div>}
          </div>

          {error && <p role="alert" className="mt-5 rounded-xl border border-[#f1d5ce] bg-[#fff8f6] px-4 py-3 text-sm text-[#9a5548]">{error}</p>}
          <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-[#edf0ec] pt-5 sm:flex-row">
            <Link className="button-quiet justify-center" to="/tickets">Cancel</Link>
            <button disabled={submitting} className="button-primary justify-center disabled:cursor-not-allowed disabled:opacity-60" type="submit">{submitting ? "Sending…" : "Send query"}<Send size={15} /></button>
          </div>
        </form>
      </div>
    </>
  );
}

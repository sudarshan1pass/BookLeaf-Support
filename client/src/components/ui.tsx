import { AlertCircle, ArrowUpRight, BookOpen, CheckCircle2, Clock3, FileText, LoaderCircle, MessageCircle, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import type { BookStatus, TicketStatus } from "../types";

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.17em] text-[#77917d]">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#21382d] md:text-[34px]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#77847c]">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const styles: Record<TicketStatus, string> = {
    OPEN: "bg-[#fff1df] text-[#a66113] ring-[#f2ddbd]",
    IN_PROGRESS: "bg-[#eaf2ff] text-[#4267a8] ring-[#d5e2f7]",
    WAITING_ON_AUTHOR: "bg-[#f1ebff] text-[#7155a2] ring-[#e2d8f4]",
    RESOLVED: "bg-[#e7f4eb] text-[#39724b] ring-[#d3e9d9]",
    CLOSED: "bg-[#eef0ed] text-[#6f7972] ring-[#e1e5e0]",
  };
  const labels: Record<TicketStatus, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    WAITING_ON_AUTHOR: "Your reply needed",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${styles[status]}`}>{labels[status]}</span>;
}

export function BookStatusBadge({ status, label }: { status: BookStatus; label?: string | null }) {
  const styles: Record<BookStatus, string> = {
    DRAFT: "bg-[#f2eee7] text-[#766248]",
    IN_REVIEW: "bg-[#eaf2ff] text-[#4267a8]",
    PUBLISHED: "bg-[#e7f4eb] text-[#39724b]",
  };
  const labels: Record<BookStatus, string> = { DRAFT: "Draft", IN_REVIEW: "In review", PUBLISHED: "Published" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}>{label || labels[status]}</span>;
}

export function LoadingState({ label = "Loading your workspace…" }: { label?: string }) {
  return <div className="panel flex min-h-44 items-center justify-center gap-2 text-sm text-[#77847c]"><LoaderCircle className="animate-spin" size={17} />{label}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#f1d5ce] bg-[#fff8f6] p-5 text-sm text-[#8d4c40]">
      <div className="flex items-start gap-3"><AlertCircle className="mt-0.5 shrink-0" size={18} /><div><p className="font-semibold">We couldn’t load this page</p><p className="mt-1 leading-5">{message}</p>{onRetry && <button className="mt-3 font-semibold underline underline-offset-4" onClick={onRetry}>Try again</button>}</div></div>
    </div>
  );
}

export function EmptyState({ icon = "books", title, description, action }: { icon?: "books" | "tickets" | "messages"; title: string; description: string; action?: ReactNode }) {
  const Icon = icon === "books" ? BookOpen : icon === "tickets" ? Ticket : MessageCircle;
  return (
    <div className="panel flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#edf4ed] text-[#527a5c]"><Icon size={21} /></span>
      <h3 className="text-base font-semibold text-[#304137]">{title}</h3>
      <p className="mt-1 max-w-sm text-sm leading-6 text-[#849087]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon, tone, detail }: { label: string; value: number | string; icon: "books" | "tickets" | "open"; tone: string; detail: string }) {
  const Icon = icon === "books" ? BookOpen : icon === "tickets" ? FileText : Clock3;
  return (
    <div className="panel flex items-start justify-between p-5 md:p-6">
      <div><p className="text-sm font-medium text-[#758178]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#263a2f]">{value}</p><p className="mt-1.5 text-xs text-[#96a098]">{detail}</p></div>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}><Icon size={19} /></span>
    </div>
  );
}

export function SectionTitle({ title, to, linkLabel = "View all" }: { title: string; to: string; linkLabel?: string }) {
  return <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight text-[#2d4035]">{title}</h2><Link to={to} className="inline-flex items-center gap-1 text-xs font-semibold text-[#558063] hover:text-[#274d35]">{linkLabel}<ArrowUpRight size={14} /></Link></div>;
}

export function SuccessMark() {
  return <CheckCircle2 size={17} className="text-[#4e8a5e]" />;
}

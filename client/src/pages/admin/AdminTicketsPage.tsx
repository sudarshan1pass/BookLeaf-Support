import { AlertTriangle, ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ErrorState, LoadingState, PageHeading, TicketStatusBadge } from "../../components/ui";
import { useApiData } from "../../hooks/useApiData";
import type { TicketCategory, TicketPriority, TicketStatus } from "../../types";

type QueueTicket = {
  id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  author: { id: string; fullName: string; email: string };
  assignedAdmin: { id: string; fullName: string } | null;
  messages: Array<{ body: string; createdAt: string }>;
  _count: { messages: number };
};
type QueueData = {
  tickets: QueueTicket[];
  pagination: { page: number; pageSize: number; total: number; pageCount: number };
};

const categories: TicketCategory[] = ["ROYALTY_AND_PAYMENTS", "ISBN_AND_METADATA_ISSUES", "PRINTING_AND_QUALITY", "DISTRIBUTION_AND_AVAILABILITY", "BOOK_STATUS_AND_PRODUCTION_UPDATES", "GENERAL_INQUIRY"];
const priorities: TicketPriority[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const statuses: TicketStatus[] = ["OPEN", "IN_PROGRESS", "WAITING_ON_AUTHOR", "RESOLVED", "CLOSED"];

function label(value: string) {
  return value.split("_").map((part) => part[0] + part.slice(1).toLowerCase()).join(" ");
}

function ageLabel(date: string) {
  const hours = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 3_600_000));
  if (hours < 24) return hours + "h old";
  return Math.floor(hours / 24) + "d old";
}

export function AdminTicketsPage() {
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const query = new URLSearchParams();
  if (status) query.set("status", status);
  if (category) query.set("category", category);
  if (priority) query.set("priority", priority);
  if (from) query.set("from", from);
  if (to) query.set("to", to);
  query.set("page", String(page));
  const path = "/api/admin/tickets?" + query.toString();
  const { data, error, loading, reload } = useApiData<QueueData>(path);
  const tickets = useMemo(() => (data?.tickets ?? []).filter((ticket) =>
    (ticket.subject + " " + ticket.author.fullName + " " + (ticket.messages[0]?.body ?? "")).toLowerCase().includes(search.trim().toLowerCase()),
  ), [data, search]);

  function changeFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <>
      <PageHeading eyebrow="Admin workspace" title="Ticket queue" description="Prioritized support requests, with the oldest urgent tickets at the top." />
      <section className="panel mb-5 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#44564a]"><Search size={16} />Filters</div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="text-[11px] font-semibold text-[#748178]">Status
            <select className="field-input mt-1.5" value={status} onChange={(event) => changeFilter(setStatus, event.target.value)}>
              <option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-[#748178]">Category
            <select className="field-input mt-1.5" value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}>
              <option value="">All categories</option>{categories.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-[#748178]">Priority
            <select className="field-input mt-1.5" value={priority} onChange={(event) => changeFilter(setPriority, event.target.value)}>
              <option value="">All priorities</option>{priorities.map((value) => <option key={value} value={value}>{label(value)}</option>)}
            </select>
          </label>
          <label className="text-[11px] font-semibold text-[#748178]">From
            <input className="field-input mt-1.5" type="date" value={from} onChange={(event) => changeFilter(setFrom, event.target.value)} />
          </label>
          <label className="text-[11px] font-semibold text-[#748178]">To
            <input className="field-input mt-1.5" type="date" value={to} onChange={(event) => changeFilter(setTo, event.target.value)} />
          </label>
          <label className="text-[11px] font-semibold text-[#748178]">Search
            <span className="relative mt-1.5 block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ba59e]" /><input className="field-input pl-9" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Subject or author" /></span>
          </label>
        </div>
      </section>
      {loading ? <LoadingState label="Loading the ticket queue…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="mb-3 flex items-center justify-between text-xs text-[#87938b]">
            <span>{data?.pagination.total ?? 0} tickets · critical and high priorities sort first</span>
            <button className="button-quiet" onClick={reload}><Clock3 size={14} />Refresh</button>
          </div>
          <div className="panel divide-y divide-[#edf0ec] overflow-hidden">
            {tickets.length === 0 ? <div className="py-16 text-center text-sm text-[#87938b]">No tickets match these filters.</div> : tickets.map((ticket) => {
              const unresolved = ticket.status !== "RESOLVED" && ticket.status !== "CLOSED";
              const urgent = unresolved && (ticket.priority === "CRITICAL" || ticket.priority === "HIGH");
              const old = unresolved && Date.now() - new Date(ticket.createdAt).getTime() > 48 * 3_600_000;
              return (
                <Link key={ticket.id} to={"/tickets/" + encodeURIComponent(ticket.id)} className={"block p-4 transition hover:bg-[#fbfcfa] md:px-6 md:py-5 " + (ticket.priority === "CRITICAL" ? "border-l-4 border-l-[#c94f42] bg-[#fffaf8]" : urgent ? "border-l-4 border-l-[#e2ad5d] bg-[#fffdfa]" : "")}>
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-semibold text-[#304137]">{ticket.subject}</h2>
                        {ticket.priority === "CRITICAL" && <span className="inline-flex items-center gap-1 rounded-full bg-[#fff0ed] px-2 py-1 text-[10px] font-bold uppercase text-[#af493e]"><AlertTriangle size={12} />Critical</span>}
                        {ticket.priority === "HIGH" && <span className="rounded-full bg-[#fff4e4] px-2 py-1 text-[10px] font-bold uppercase text-[#a36516]">High</span>}
                        <TicketStatusBadge status={ticket.status} />
                      </div>
                      <p className="mt-1.5 line-clamp-1 text-xs text-[#829087]">{ticket.messages[0]?.body || "No message yet"}</p>
                    </div>
                    <ArrowRight size={16} className="mt-1 text-[#9da79f]" />
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-[#89958c]">
                    <span>{ticket.author.fullName} · {ticket.author.email}</span>
                    <span>{label(ticket.category)}</span>
                    <span className={old ? "font-semibold text-[#a65e26]" : ""}><CalendarDays size={12} className="mr-1 inline" />{ageLabel(ticket.createdAt)}{old ? " · needs attention" : ""}</span>
                    <span>{ticket._count.messages} messages</span>
                    <span>{ticket.assignedAdmin ? "Assigned to " + ticket.assignedAdmin.fullName : "Unassigned"}</span>
                  </div>
                </Link>
              );
            })}
          </div>
          {data && data.pagination.pageCount > 1 && <div className="mt-4 flex items-center justify-end gap-3 text-xs text-[#718077]">
            <button className="button-secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={14} />Previous</button>
            <span>Page {page} of {data.pagination.pageCount}</span>
            <button className="button-secondary" disabled={page >= data.pagination.pageCount} onClick={() => setPage((value) => value + 1)}>Next<ChevronRight size={14} /></button>
          </div>}
        </>
      )}
    </>
  );
}

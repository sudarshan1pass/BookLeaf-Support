import { ArrowRight, Plus, Search, Ticket } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeading, TicketStatusBadge } from "../components/ui";
import { useApiData } from "../hooks/useApiData";
import type { Ticket as SupportTicket, TicketStatus } from "../types";

type TicketListItem = SupportTicket & { messages: Array<{ body: string; createdAt: string }>; _count: { messages: number } };
const filters: Array<{ label: string; value: "ALL" | TicketStatus }> = [
  { label: "All tickets", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "Your reply needed", value: "WAITING_ON_AUTHOR" },
  { label: "Resolved", value: "RESOLVED" },
  { label: "Closed", value: "CLOSED" },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function TicketsPage() {
  const { data, error, loading, reload } = useApiData<{ tickets: TicketListItem[] }>("/api/author/tickets");
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("ALL");
  const [search, setSearch] = useState("");
  const tickets = useMemo(() => (data?.tickets ?? []).filter((ticket) => {
    const matchesStatus = filter === "ALL" || ticket.status === filter;
    const matchesSearch = `${ticket.subject} ${ticket.messages[0]?.body ?? ""}`.toLowerCase().includes(search.trim().toLowerCase());
    return matchesStatus && matchesSearch;
  }), [data, filter, search]);

  return (
    <>
      <PageHeading eyebrow="Your conversations" title="My tickets" description="Follow your questions and replies from the BookLeaf support team." action={<Link className="button-primary" to="/support/new"><Plus size={16} />Submit a query</Link>} />
      {loading ? <LoadingState label="Loading your tickets…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          {data && data.tickets.length > 0 && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {filters.map(({ label, value }) => (
                  <button key={value} onClick={() => setFilter(value)} className={`filter-chip ${filter === value ? "filter-chip-active" : ""}`}>
                    {label}{value === "ALL" && <span className="ml-1 opacity-60">{data.tickets.length}</span>}
                  </button>
                ))}
              </div>
              <label className="relative mb-5 block w-full sm:max-w-sm">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba59e]" />
                <input className="field-input pl-10" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by subject or message" aria-label="Search tickets" />
              </label>
            </>
          )}
          {tickets.length === 0 ? (
            data?.tickets.length ? <div className="panel py-14 text-center text-sm text-[#829087]">No tickets match your filters.</div> : <EmptyState icon="tickets" title="No support tickets yet" description="Send your first query and our support team will reply here." action={<Link className="button-primary" to="/support/new"><Plus size={16} />Submit a query</Link>} />
          ) : (
            <div className="panel divide-y divide-[#edf0ec] overflow-hidden">
              {tickets.map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="flex items-center gap-4 p-4 transition hover:bg-[#fbfcfa] md:px-6 md:py-5">
                  <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf1f8] text-[#6279a3] sm:flex"><Ticket size={19} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2"><span className="truncate text-sm font-semibold text-[#304137]">{ticket.subject}</span><span className="text-[10px] text-[#a0aaa2]">{ticket._count.messages} {ticket._count.messages === 1 ? "message" : "messages"}</span></span>
                    <span className="mt-1.5 block truncate text-xs text-[#8c9890]">{ticket.messages[0]?.body || "No message yet"}</span>
                    <span className="mt-2 block text-[11px] text-[#a0aaa2]">Updated {formatDate(ticket.updatedAt)}</span>
                  </span>
                  <TicketStatusBadge status={ticket.status} />
                  <ArrowRight size={16} className="hidden shrink-0 text-[#a0aaa2] sm:block" />
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

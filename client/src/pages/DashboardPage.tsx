import { ArrowRight, BookOpen, Headphones, Sparkles, Ticket } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { EmptyState, ErrorState, LoadingState, PageHeading, SectionTitle, StatCard, TicketStatusBadge } from "../components/ui";
import { useApiData } from "../hooks/useApiData";
import type { Book, Ticket as SupportTicket } from "../types";

type DashboardData = {
  counts: { books: number; tickets: number; openTickets: number };
  recentBooks: Book[];
  recentTickets: Array<SupportTicket & { messages: Array<{ body: string; createdAt: string }> }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(value));
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, error, loading, reload } = useApiData<DashboardData>("/api/author/dashboard");

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "Please try again."} onRetry={reload} />;

  return (
    <>
      <PageHeading eyebrow="Your workspace" title={`Good to see you, ${user?.fullName.split(" ")[0] ?? "author"}.`} description="Keep your publishing projects moving and stay connected with your support team." />

      <section className="relative mb-7 overflow-hidden rounded-[26px] bg-[#e6f0e5] px-6 py-7 md:px-9 md:py-8">
        <div className="absolute -right-7 -top-16 h-56 w-56 rounded-full border-[1px] border-[#c9ddc8]" />
        <div className="absolute -right-1 -top-9 h-44 w-44 rounded-full border-[1px] border-[#c9ddc8]" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/65 px-3 py-1.5 text-[11px] font-semibold text-[#547c5b]"><Sparkles size={13} />Your author workspace</span>
          <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight tracking-[-0.035em] text-[#244432] md:text-[28px]">Your next chapter starts with a little progress.</h2>
          <p className="mt-2 max-w-lg text-sm leading-6 text-[#68816d]">See how your books are coming along, or pick up where you left off with support.</p>
          <Link to="/support/new" className="button-primary mt-5"><Headphones size={16} />Contact support</Link>
        </div>
        <div className="absolute bottom-0 right-14 hidden text-[#5a805d]/70 lg:block"><BookOpen size={110} strokeWidth={0.8} /></div>
      </section>

      <section className="mb-9 grid gap-4 sm:grid-cols-3">
        <StatCard label="My books" value={data.counts.books} icon="books" tone="bg-[#eaf3eb] text-[#52805c]" detail="Across your catalogue" />
        <StatCard label="Support tickets" value={data.counts.tickets} icon="tickets" tone="bg-[#edf0fa] text-[#5c70a1]" detail="Conversations with our team" />
        <StatCard label="Needs attention" value={data.counts.openTickets} icon="open" tone="bg-[#fbf0df] text-[#a87536]" detail="Open or waiting for a reply" />
      </section>

      <div className="grid gap-7 xl:grid-cols-[1.1fr_0.9fr]">
        <section>
          <SectionTitle title="Recently updated books" to="/books" />
          {data.recentBooks.length === 0 ? (
            <EmptyState title="Your books will appear here" description="When a book is added to your author account, you’ll find its details and publishing status here." />
          ) : (
            <div className="panel divide-y divide-[#edf0ec] overflow-hidden">
              {data.recentBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.id}`} className="flex items-center gap-4 p-4 transition hover:bg-[#fbfcfa] md:p-5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf3ea] text-[#5d805d]"><BookOpen size={19} /></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#304137]">{book.title}</span><span className="mt-1 block text-xs text-[#8c9890]">{book.genre || "Book"} · Updated {formatDate(book.updatedAt)}</span></span>
                  <div className="hidden sm:block"><span className="sr-only">Status: </span><span className="book-status-pill">{book.status.replaceAll("_", " ").toLowerCase()}</span></div>
                  <ArrowRight size={16} className="text-[#a0aaa2]" />
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionTitle title="Recent support" to="/tickets" />
          {data.recentTickets.length === 0 ? (
            <EmptyState icon="tickets" title="No support tickets yet" description="If you have a question, start a conversation with our support team." action={<Link className="button-secondary" to="/support/new"><Ticket size={15} />Submit a query</Link>} />
          ) : (
            <div className="panel divide-y divide-[#edf0ec] overflow-hidden">
              {data.recentTickets.map((ticket) => (
                <Link key={ticket.id} to={`/tickets/${ticket.id}`} className="block p-4 transition hover:bg-[#fbfcfa] md:p-5">
                  <div className="flex items-start justify-between gap-3"><span className="line-clamp-1 text-sm font-semibold text-[#304137]">{ticket.subject}</span><TicketStatusBadge status={ticket.status} /></div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#87938a]">{ticket.messages[0]?.body || "No message yet"}</p>
                  <p className="mt-2 text-[11px] text-[#a0aaa2]">Updated {formatDate(ticket.updatedAt)}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

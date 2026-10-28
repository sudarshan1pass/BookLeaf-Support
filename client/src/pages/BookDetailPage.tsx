import { ArrowLeft, BookOpen, CalendarDays, Hash, LibraryBig } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { BookStatusBadge, ErrorState, LoadingState, PageHeading } from "../components/ui";
import { useApiData } from "../hooks/useApiData";

type BookDetails = {
  id: string;
  title: string;
  subtitle: string | null;
  genre: string | null;
  description: string | null;
  status: "DRAFT" | "IN_REVIEW" | "PUBLISHED";
  statusLabel: string | null;
  isbn: string | null;
  publicationDate: string | null;
  mrp: string | null;
  authorRoyaltyPerCopy: string | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: string;
  royaltyPaid: string;
  royaltyPending: string;
  lastRoyaltyPayoutDate: string | null;
  printPartner: string | null;
  availableOn: string[];
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

function formatAmount(value: string | null) {
  return value === null ? "Not available" : new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}

export function BookDetailPage() {
  const { bookId = "" } = useParams();
  const { data, error, loading, reload } = useApiData<{ book: BookDetails }>(`/api/author/books/${encodeURIComponent(bookId)}`);

  if (loading) return <LoadingState label="Loading book details…" />;
  if (error || !data) return <ErrorState message={error ?? "The requested book could not be loaded."} onRetry={reload} />;

  const { book } = data;
  return (
    <>
      <Link to="/books" className="back-link mb-6"><ArrowLeft size={15} />Back to My Books</Link>
      <PageHeading eyebrow="Book details" title={book.title} description={book.subtitle || undefined} action={<BookStatusBadge status={book.status} label={book.statusLabel} />} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.75fr)]">
        <section className="panel p-6 md:p-8">
          <div className="mb-6 flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf3ea] text-[#527a5a]"><BookOpen size={19} /></span><div><p className="text-sm font-semibold text-[#33453a]">About this book</p><p className="text-xs text-[#929d95]">Your book information</p></div></div>
          <div className="space-y-6">
            <div><p className="detail-label">Title</p><p className="mt-1.5 text-sm font-medium text-[#34463a]">{book.title}</p></div>
            {book.subtitle && <div><p className="detail-label">Subtitle</p><p className="mt-1.5 text-sm text-[#56645a]">{book.subtitle}</p></div>}
            <div><p className="detail-label">Description</p><p className="mt-1.5 whitespace-pre-wrap text-sm leading-7 text-[#5f6e63]">{book.description || "No description has been added yet."}</p></div>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="panel p-6">
            <p className="mb-5 text-sm font-semibold text-[#33453a]">Book information</p>
            <div className="space-y-5">
              <div className="flex gap-3"><span className="detail-icon"><LibraryBig size={16} /></span><span><span className="detail-label">Genre</span><span className="mt-1 block text-sm text-[#536157]">{book.genre || "Not set"}</span></span></div>
              <div className="flex gap-3"><span className="detail-icon"><Hash size={16} /></span><span><span className="detail-label">ISBN</span><span className="mt-1 block text-sm text-[#536157]">{book.isbn || "Not assigned"}</span></span></div>
              <div className="flex gap-3"><span className="detail-icon"><CalendarDays size={16} /></span><span><span className="detail-label">Added to BookLeaf</span><span className="mt-1 block text-sm text-[#536157]">{formatDate(book.createdAt)}</span></span></div>
            </div>
          </section>
          <section className="panel p-6">
            <p className="mb-5 text-sm font-semibold text-[#33453a]">Publishing and royalty details</p>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
              <div><dt className="detail-label">Publication date</dt><dd className="mt-1 text-sm text-[#536157]">{book.publicationDate ? formatDate(book.publicationDate) : "Not set"}</dd></div>
              <div><dt className="detail-label">MRP</dt><dd className="mt-1 text-sm text-[#536157]">{formatAmount(book.mrp)}</dd></div>
              <div><dt className="detail-label">Royalty per copy</dt><dd className="mt-1 text-sm text-[#536157]">{formatAmount(book.authorRoyaltyPerCopy)}</dd></div>
              <div><dt className="detail-label">Copies sold</dt><dd className="mt-1 text-sm text-[#536157]">{book.totalCopiesSold.toLocaleString("en-IN")}</dd></div>
              <div><dt className="detail-label">Royalty earned</dt><dd className="mt-1 text-sm text-[#536157]">{formatAmount(book.totalRoyaltyEarned)}</dd></div>
              <div><dt className="detail-label">Paid</dt><dd className="mt-1 text-sm text-[#536157]">{formatAmount(book.royaltyPaid)}</dd></div>
              <div><dt className="detail-label">Pending</dt><dd className="mt-1 text-sm font-semibold text-[#536157]">{formatAmount(book.royaltyPending)}</dd></div>
              <div><dt className="detail-label">Last payout</dt><dd className="mt-1 text-sm text-[#536157]">{book.lastRoyaltyPayoutDate ? formatDate(book.lastRoyaltyPayoutDate) : "Not recorded"}</dd></div>
              <div className="col-span-2"><dt className="detail-label">Print partner</dt><dd className="mt-1 text-sm text-[#536157]">{book.printPartner || "Not set"}</dd></div>
              <div className="col-span-2"><dt className="detail-label">Available on</dt><dd className="mt-1 text-sm leading-6 text-[#536157]">{book.availableOn.length ? book.availableOn.join(", ") : "Not listed"}</dd></div>
            </dl>
          </section>
          <section className="rounded-2xl border border-[#dfe9df] bg-[#eff5ee] p-5">
            <p className="text-sm font-semibold text-[#35513b]">Have a question about this book?</p>
            <p className="mt-1.5 text-xs leading-5 text-[#758875]">Send our team a support query and keep the conversation in your portal.</p>
            <Link to={`/support/new?book=${encodeURIComponent(book.title)}`} className="button-secondary mt-4 w-full justify-center">Contact support<ArrowLeft className="rotate-180" size={15} /></Link>
          </section>
        </aside>
      </div>
    </>
  );
}

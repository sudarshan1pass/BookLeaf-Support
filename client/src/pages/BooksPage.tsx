import { ArrowUpRight, BookOpen, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeading, BookStatusBadge } from "../components/ui";
import { useApiData } from "../hooks/useApiData";
import type { Book } from "../types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(new Date(value));
}

export function BooksPage() {
  const { data, error, loading, reload } = useApiData<{ books: Book[] }>("/api/author/books");
  const [search, setSearch] = useState("");
  const filteredBooks = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return data?.books ?? [];
    return (data?.books ?? []).filter((book) => `${book.title} ${book.subtitle ?? ""} ${book.genre ?? ""}`.toLowerCase().includes(query));
  }, [data, search]);

  return (
    <>
      <PageHeading eyebrow="Your catalogue" title="My books" description="A quick look at the books connected to your author account." />
      {loading ? <LoadingState label="Loading your books…" /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          {data && data.books.length > 0 && (
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#77847c]">{data.books.length} {data.books.length === 1 ? "book" : "books"}</p>
              <label className="relative block w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9ba59e]" />
                <input className="field-input pl-10" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search your books" aria-label="Search your books" />
              </label>
            </div>
          )}
          {filteredBooks.length === 0 ? (
            data?.books.length ? <div className="panel py-14 text-center text-sm text-[#829087]">No books match “{search}”.</div> : <EmptyState title="No books in your catalogue yet" description="Books added to your author account will appear here with their details and current status." />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredBooks.map((book) => (
                <Link key={book.id} to={`/books/${book.id}`} className="book-card group flex min-h-60 flex-col p-5 md:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-[15px] bg-[#eaf2e8] text-[#557a5c]"><BookOpen size={20} strokeWidth={1.8} /></span>
                    <BookStatusBadge status={book.status} label={book.statusLabel} />
                  </div>
                  <div className="mt-5 flex-1">
                    <h2 className="line-clamp-2 text-lg font-semibold leading-6 tracking-tight text-[#2c4034] group-hover:text-[#4f7959]">{book.title}</h2>
                    {book.subtitle && <p className="mt-1 line-clamp-1 text-sm text-[#77847c]">{book.subtitle}</p>}
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#8b978e]">{book.description || "No description has been added."}</p>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t border-[#edf0ec] pt-4">
                    <span className="text-xs text-[#929e95]">{book.genre || "Genre not set"} · Updated {formatDate(book.updatedAt)}</span>
                    <ArrowUpRight size={16} className="text-[#7c9780] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

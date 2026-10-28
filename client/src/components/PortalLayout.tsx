import { NavLink, Outlet } from "react-router-dom";
import { BookOpen, LayoutDashboard, LifeBuoy, LogOut, Plus, Ticket, Sprout } from "lucide-react";
import { useAuth } from "../auth/AuthContext";

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/books", label: "My books", icon: BookOpen },
  { to: "/tickets", label: "My tickets", icon: Ticket },
];

export function PortalLayout() {
  const { user, logout } = useAuth();
  const initials = (user?.fullName ?? "Author")
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f5f7f4] text-[#263630]">
      <aside className="portal-sidebar md:fixed md:inset-y-0 md:left-0 md:flex md:w-[256px] md:flex-col">
        <div className="flex items-center gap-3 px-5 py-5 md:px-7 md:py-8">
          <span className="brand-mark"><Sprout size={20} strokeWidth={2.3} /></span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-white">bookleaf</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.19em] text-emerald-200/70">Author studio</p>
          </div>
        </div>

        <div className="hidden px-7 pb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40 md:block">Workspace</div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-4 md:flex-col md:px-4" aria-label="Main navigation">
          {navigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden flex-1 md:block" />
        <div className="hidden px-4 pb-4 md:block">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-[#d4e9d9] text-[#275541]"><LifeBuoy size={18} /></div>
            <p className="text-sm font-medium text-white">Need a hand?</p>
            <p className="mt-1 text-xs leading-5 text-white/55">Our support team is here to help with your publishing journey.</p>
            <NavLink to="/support/new" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-200 hover:text-white">
              <Plus size={14} /> Contact support
            </NavLink>
          </div>
        </div>
        <div className="hidden items-center gap-3 border-t border-white/10 px-5 py-4 md:flex">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user?.fullName}</span>
            <span className="block truncate text-[11px] text-white/50">Author account</span>
          </span>
          <button className="icon-button text-white/55 hover:bg-white/10 hover:text-white" onClick={logout} title="Sign out" aria-label="Sign out">
            <LogOut size={17} />
          </button>
        </div>
      </aside>

      <div className="md:pl-[256px]">
        <header className="flex min-h-[66px] items-center justify-between border-b border-[#e7ece7] bg-white/85 px-5 backdrop-blur md:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b9890]">BookLeaf · Author portal</p>
            <p className="mt-0.5 text-sm font-medium text-[#34443c]">A home for your books and support</p>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <span className="max-w-32 truncate text-xs font-medium">{user?.fullName}</span>
            <button className="icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-[#34443c]">{user?.fullName}</p>
              <p className="text-xs text-[#8b9890]">Author</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-[#e1eee3] text-xs font-bold text-[#315a43] shadow-sm">{initials}</span>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10"><Outlet /></main>
      </div>
    </div>
  );
}

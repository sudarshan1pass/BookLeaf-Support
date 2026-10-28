import { Feather, LogOut, Ticket } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export function AdminLayout() {
  const { user, logout } = useAuth();
  const initials = (user?.fullName ?? "Admin").split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="min-h-screen bg-[#f5f7f4]">
      <aside className="portal-sidebar fixed inset-y-0 left-0 hidden w-64 flex-col md:flex">
        <div className="flex items-center gap-3 px-6 py-7">
          <span className="brand-mark"><Feather size={20} /></span>
          <span className="text-lg font-semibold tracking-tight text-white">bookleaf</span>
        </div>
        <p className="px-6 pb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Support operations</p>
        <nav className="flex-1 px-3">
          <NavLink to="/tickets" className={({ isActive }) => "nav-link w-full " + (isActive ? "nav-link-active" : "")}>
            <Ticket size={17} />Ticket queue
          </NavLink>
        </nav>
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-xs font-semibold text-white">{initials}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{user?.fullName}</span>
            <span className="block truncate text-[11px] text-white/50">Administrator</span>
          </span>
          <button className="icon-button text-white/55 hover:bg-white/10 hover:text-white" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
        </div>
      </aside>
      <div className="md:pl-[256px]">
        <header className="flex min-h-[66px] items-center justify-between border-b border-[#e7ece7] bg-white/85 px-5 backdrop-blur md:px-10">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8b9890]">BookLeaf · Admin portal</p>
            <p className="mt-0.5 text-sm font-medium text-[#34443c]">Support ticket operations</p>
          </div>
          <div className="flex items-center gap-3 md:hidden">
            <span className="max-w-32 truncate text-xs font-medium">{user?.fullName}</span>
            <button className="icon-button" onClick={logout} title="Sign out" aria-label="Sign out"><LogOut size={17} /></button>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10"><Outlet /></main>
      </div>
    </div>
  );
}

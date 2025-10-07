import React, { useState, useEffect, useCallback } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Clapperboard, Settings, Search, ListVideo,
  ChevronLeft, ChevronRight, LogOut, Menu, X,
} from "lucide-react";
import { auth } from "..";
import { signOut } from "firebase/auth";

const navItems = [
  { label: "My Videos", to: "/video", icon: Clapperboard },
  { label: "Search Videos", to: "/search", icon: Search },
  { label: "My Playlists", to: "/playlist", icon: ListVideo },
  { label: "Settings", to: "/settings", icon: Settings },
];

export default function SideBar() {
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("ns_collapsed") === "1"; } catch { return false; }
  });
  const [openMobile, setOpenMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try { localStorage.setItem("ns_collapsed", collapsed ? "1" : "0"); } catch {}
  }, [collapsed]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpenMobile(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { document.body.style.overflow = openMobile ? "hidden" : ""; }, [openMobile]);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    navigate("/", { replace: true });
    setOpenMobile(false);
  }, [navigate]);

  const widthDesktop = collapsed ? "md:w-16" : "md:w-64";

  const NavList = ({ showLabels, onItemClick }) => (
    <nav className="mt-2 flex flex-col gap-1 px-2">
      {navItems.map(({ label, to, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              "group flex items-center gap-3 rounded-lg px-2 py-2 text-sm",
              "hover:bg-slate-100",
              isActive ? "bg-slate-100 text-slate-900" : "text-slate-700 hover:text-slate-900",
            ].join(" ")
          }
          onClick={onItemClick}
          title={label}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {showLabels && <span className="truncate">{label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        type="button"
        aria-label="Open menu"
        className="fixed left-3 top-3 z-50 grid h-10 w-10 place-items-center rounded-lg bg-white/90 backdrop-blur border border-slate-200 shadow md:hidden"
        onClick={() => setOpenMobile(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar with ChevronRight to collapse */}
      <aside
        className={`fixed top-0 left-0 hidden md:block h-screen w-64 ${widthDesktop}`}
        aria-label="Primary"
      >
        <div className="flex h-full flex-col bg-white border-r border-slate-200">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="NoteSync logo">
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="red" strokeWidth="2" />
                <path d="M10 8l6 4-6 4V8z" fill="red" />
              </svg>
              {!collapsed && <span className="text-lg font-semibold text-red-500">NoteSync</span>}
            </div>
            <button
              type="button"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100"
              onClick={() => setCollapsed((v) => !v)}
            >
              {/* Requirement: ChevronRight collapses when expanded. ChevronLeft expands when collapsed. */}
              {collapsed ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>

          <NavList showLabels={!collapsed} />

          <div className="mt-auto px-2 pb-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">Sign out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          openMobile ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpenMobile(false)}
        aria-hidden={!openMobile}
      />

      {/* Mobile drawer (full width, no collapse) */}
      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 md:hidden transform transition-transform duration-200 ${
          openMobile ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
      >
        <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
          <div className="flex items-center justify-between px-3 py-3">
            <div className="flex items-center gap-2">
              <svg width="28" height="28" viewBox="0 0 24 24" role="img" aria-label="NoteSync logo">
                <circle cx="12" cy="12" r="9.5" fill="none" stroke="red" strokeWidth="2" />
                <path d="M10 8l6 4-6 4V8z" fill="red" />
              </svg>
              <span className="text-lg font-semibold text-red-500">NoteSync</span>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-100"
              onClick={() => setOpenMobile(false)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <NavList showLabels={true} onItemClick={() => setOpenMobile(false)} />

          <div className="mt-auto px-2 pb-2">
            <button
              type="button"
              className="w-full flex items-center gap-3 rounded-lg px-2 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="truncate">Sign out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

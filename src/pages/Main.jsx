import { useState, useMemo } from "react";
import DesktopSidebar from "../components/ui/sidebar/Sidebar";
import MainHeader from "../components/MainHeader";
import { useIsMdUp } from "../services/utils/breakpoint";

export default function Main() {
  const mdUp = useIsMdUp();
  const [collapsed, setCollapsed] = useState(false);   // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile
  const sidebarW = collapsed ? "3.5rem" : "16rem";

  const sidebarVisible = useMemo(() => (mdUp ? !collapsed : mobileOpen), [mdUp, collapsed, mobileOpen]);

  const toggleSidebar = () => {
    if (mdUp) setCollapsed(v => !v);
    else setMobileOpen(v => !v);
  };

  return (
    <div style={{ "--sidebar-w": sidebarW }}>
      <DesktopSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="min-h-screen md:pl-[var(--sidebar-w)] md:[transition:padding-left_300ms_ease]">
        <MainHeader sidebarVisible={sidebarVisible} onToggle={toggleSidebar} />
        <main className="p-4">...</main>
      </div>
    </div>
  );
}

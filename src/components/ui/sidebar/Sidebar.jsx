import SidebarContent from "./SidebarContent";

const Sidebar = ({ collapsed, mobileOpen, onCloseMobile }) => {
  const deskWidth = collapsed ? "w-14" : "w-64";

  return (
    <>
      {/* Desktop fixed */}
      <aside className={`hidden md:block fixed top-0 left-0 h-screen ${deskWidth} z-30 overflow-hidden transition-[width] duration-300`}>
        <div className="h-full bg-white border-r border-r-slate-200">
          <SidebarContent collapsed={collapsed} />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div className="md:hidden">
        <div
          onClick={onCloseMobile}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        />
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-r-slate-200 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
          role="dialog"
          aria-modal="true"
        >
          <SidebarContent collapsed={false} onCloseMobile={onCloseMobile} />
        </aside>
      </div>
    </>
  );
}

export default Sidebar;



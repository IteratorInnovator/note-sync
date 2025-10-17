import { PanelLeft, PanelRight } from "lucide-react";

const MainHeader = ({ title, sidebarVisible, onToggle }) => {
  return (
    <header className="sticky top-0 z-20 bg-zinc-50 border-b border-slate-200">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        <button
          type="button"
          onClick={onToggle}
          aria-label={sidebarVisible ? "Hide sidebar" : "Show sidebar"}
          className="rounded-md p-2 group hover:bg-red-500"
        >
          {sidebarVisible ? <PanelLeft className="size-5 group-hover:text-white" /> : <PanelRight className="size-5 group-hover:text-white" />}
        </button>
        <h1 className="text-xl text-slate-900 font-semibold">{title}</h1>
      </div>
    </header>
  );
}

export default MainHeader;
import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar/Sidebar";
import MainHeader from "../components/MainHeader";
import MyVideosView from "../components/views/MyVideosView";
import SearchView from "../components/views/SearchView";
import PlaylistsView from "../components/views/PlaylistsView";
import { useIsMdUp } from "../services/utils/breakpoint";

const VALID_PATHS = new Set(["videos", "search", "playlists"]);

export default function Main() {
  const mdUp = useIsMdUp();
  const [title, setTitle] = useState("My Videos");
  const [collapsed, setCollapsed] = useState(false);   // desktop
  const [mobileOpen, setMobileOpen] = useState(false); // mobile
  const sidebarW = collapsed ? "3.5rem" : "16rem";

  const sidebarVisible = useMemo(() => (mdUp ? !collapsed : mobileOpen), [mdUp, collapsed, mobileOpen]);

  const toggleSidebar = () => {
    if (mdUp) setCollapsed(v => !v);
    else setMobileOpen(v => !v);
  };  

  const { pathname } = useLocation();
  const navigate = useNavigate();
  const tab = useMemo(() => pathname.split("/")[1] || "videos", [pathname]);

  useEffect(() => {
    if (!VALID_PATHS.has(tab)) navigate("/videos", { replace: true });
  }, [tab, navigate]);

  const view = useMemo(() => {
    switch (tab) {
      case "videos":    
        setTitle("My Videos");
        return <MyVideosView />;
      case "search":    
        setTitle("Search Videos");
        return <SearchView />;
      case "playlists": 
        setTitle("My Playlists");
        return <PlaylistsView />;
      default:   
        setTitle("My Videos");       
        return null; // immediately redirected above
    }
  }, [tab]);


  return (
    <div style={{ "--sidebar-w": sidebarW }}>
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="min-h-screen md:pl-[var(--sidebar-w)] md:[transition:padding-left_300ms_ease]">
        <MainHeader title={title} sidebarVisible={sidebarVisible} onToggle={toggleSidebar} />
        <main className="p-4">{view}</main>
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/sidebar/Sidebar";
import MainHeader from "../components/MainHeader";
import MyVideosView from "../views/MyVideosView";
import SearchView from "../views/SearchView";
import SettingsView from "../views/SettingsView";
import WatchView from "../views/WatchView";
import { useIsMdUp } from "../utils/breakpoint";
import PlaylistsView from "../views/PlaylistsView";

const VALID_PATHS = new Set(["videos", "search", "settings", "watch"]);

export default function Main() {
    const mdUp = useIsMdUp();
    const [title, setTitle] = useState("My Videos");
    const [collapsed, setCollapsed] = useState(false); // desktop
    const [mobileOpen, setMobileOpen] = useState(false); // mobile
    const [searchTerm, setSearchTerm] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const sidebarW = collapsed ? "3.5rem" : "16rem";

    const sidebarVisible = useMemo(
        () => (mdUp ? !collapsed : mobileOpen),
        [mdUp, collapsed, mobileOpen]
    );

    const toggleSidebar = () => {
        if (mdUp) setCollapsed((v) => !v);
        else setMobileOpen((v) => !v);
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
                return (
                    <SearchView
                        searchTerm={searchTerm}
                        onSearchTermChange={setSearchTerm}
                        results={searchResults}
                        onResultsChange={setSearchResults}
                    />
                );
            case "playlists":
                setTitle("My Playlists");
                return <PlaylistsView />;
            case "settings":
                setTitle("Settings");
                return <SettingsView />;
            case "watch":
                setTitle("Watch");
                return <WatchView />;
            default:
                setTitle("My Videos");
                return null; // immediately redirected above
        }
    }, [tab, searchTerm, searchResults]);

    return (
        <div style={{ "--sidebar-w": sidebarW }}>
            <Sidebar
                collapsed={collapsed}
                mobileOpen={mobileOpen}
                onCloseMobile={() => setMobileOpen(false)}
            />

            <div className="min-h-screen md:pl-[var(--sidebar-w)] md:[transition:padding-left_300ms_ease]">
                <MainHeader
                    title={title}
                    sidebarVisible={sidebarVisible}
                    onToggle={toggleSidebar}
                />
                <main className="p-4">{view}</main>
            </div>
        </div>
    );
}

import {
    Clapperboard,
    Settings,
    Search,
    ListVideo,
    LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../../..";

const navItems = [
    { label: "My Videos", to: "/videos", icon: Clapperboard },
    { label: "Search Videos", to: "/search", icon: Search },
    { label: "My Playlists", to: "/playlists", icon: ListVideo },
    { label: "Settings", to: "/settings", icon: Settings },
];

const SidebarContent = ({ collapsed, onCloseMobile }) => {
    const itemBase =
        "grid items-center h-10 rounded-xl text-slate-900 text-sm transition-colors hover:bg-neutral-200";
    const cols = "grid-cols-[28px_var(--label-col)]";
    const pad = collapsed ? "px-1.5" : "px-2";
    const gap = collapsed ? "gap-x-0" : "gap-x-3";

    const labelBase =
        "text-left min-w-0 truncate transition-[opacity,transform] duration-300 ease-in-out";
    const labelHidden = "opacity-0 -translate-x-2";
    const labelShown = "opacity-100 translate-x-0";

    return (
        <div
            className="flex h-full flex-col"
            style={{ "--label-col": collapsed ? "0fr" : "1fr" }}
        >
            {/* Brand collapses, keeps DOM for smooth slide */}
            <div
                className={`overflow-hidden transition-[max-height,opacity,padding] duration-300
              ${
                  collapsed
                      ? "max-h-0 opacity-0 py-0 px-0"
                      : "max-h-20 opacity-100 py-2 px-2"
              }`}
            >
                <div className="flex flex-row items-center h-10 px-2 gap-x-3">
                    <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        aria-label="NoteSync"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="9.5"
                            fill="none"
                            stroke="red"
                            strokeWidth="2"
                        />
                        <path d="M10 8l6 4-6 4V8z" fill="red" />
                    </svg>
                    <span className="text-lg font-semibold text-red-500">
                        NoteSync
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="mt-1 px-2 flex flex-col gap-1">
                {navItems.map(({ label, to, icon: Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={onCloseMobile}
                        aria-label={label}
                        title={collapsed ? label : undefined}
                        className={({ isActive }) =>
                            `${itemBase} ${cols} ${gap} ${pad} ${isActive
                                ? "bg-sky-200 text-sky-700 font-medium"
                                : "hover:bg-sky-100 hover:text-sky-600"
                            }`
                        }
                    >
                        <Icon className="size-4 place-self-center" />
                        <span
                            className={`${labelBase} ${collapsed ? labelHidden : labelShown
                                }`}
                        >
                            {label}
                        </span>
                    </NavLink>
                ))}
            </nav>

            <div className="mt-auto px-2 pb-2">
                <button
                    type="button"
                    onClick={async () => {
                        await signOut(auth);
                    }}
                    className={`cursor-pointer ${itemBase} ${cols} ${gap} ${pad} w-full`}
                    aria-label="Sign out"
                    title={collapsed ? "Sign out" : undefined}
                >
                    <LogOut className="size-4 place-self-center" />
                    <span
                        className={`${labelBase} ${
                            collapsed ? labelHidden : labelShown
                        }`}
                    >
                        Sign out
                    </span>
                </button>
            </div>
        </div>
    );
};

export default SidebarContent;

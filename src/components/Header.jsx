import AuthDialog from "./auth/AuthDialog";
import React from "react";

const Header = ({ openAuthDialog, switchAuthView }) => {
    return (
        <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
                <nav className="flex items-center justify-between gap-3">
                    {/* left: logo */}
                    <a href="#" className="flex items-center gap-2">
                        <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="9.5"
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="2"
                            />
                            <path d="M10 8l6 4-6 4V8z" fill="#ef4444" />
                        </svg>
                        <span className="text-md sm:text-2xl font-bold text-red-500">
                            NoteSync
                        </span>
                    </a>

                    {/* center: links */}
                    <div className="hidden md:flex items-center gap-10">
                        <a
                            href="#features"
                            className="group relative text-slate-700 transition-colors duration-200 hover:text-red-500"
                        >
                            Features
                            <span className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-full origin-left scale-x-0 bg-red-500 transition-transform duration-200 ease-out group-hover:scale-x-100" />
                        </a>
                        <a
                            href="#how-it-works"
                            className="group relative text-slate-700 transition-colors duration-200 hover:text-red-500"
                        >
                            How It Works
                            <span className="pointer-events-none absolute left-0 -bottom-1 h-0.5 w-full origin-left scale-x-0 bg-red-500 transition-transform duration-200 ease-out group-hover:scale-x-100" />
                        </a>
                    </div>

                    {/* right: actions */}
                    <div className="flex items-center gap-2 sm:gap-3 max-md:mr-6">
                        <button
                            className="rounded-xl px-2.5 py-2 text-[11px] font-semibold text-slate-700 transition-colors duration-200 hover:bg-red-500 hover:text-white sm:px-4 sm:text-sm"
                            onClick={() => {
                                openAuthDialog();
                                switchAuthView("login");
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            className="rounded-xl px-2.5 py-2 text-[11px] font-semibold text-white transition-transform duration-200 ease-in-out hover:scale-105 bg-red-500 sm:px-4 sm:text-sm"
                            onClick={() => {
                                openAuthDialog();
                                switchAuthView("signup");
                            }}
                        >
                            Get Started
                        </button>
                    </div>
                </nav>
            </div>
        </header>
    );
};

export default Header;

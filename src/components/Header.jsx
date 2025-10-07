import AuthDialog from "./auth/AuthDialog";
import React from "react";

const Header = ({ openAuthDialog, switchAuthView }) => {
    return (
        <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6 py-3">
                <nav className="flex items-center justify-between">
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
                            className="text-slate-700 hover:text-red-500"
                        >
                            Features
                        </a>
                        <a
                            href="#how-it-works"
                            className="text-slate-700 hover:text-red-500"
                        >
                            How It Works
                        </a>
                    </div>

                    {/* right: actions */}
                    <div className="flex items-center gap-4">
                        <button
                            className="text-sm rounded-xl px-4 py-2 font-semibold text-slate-700 hover:text-white hover:bg-red-500 transition-colors duration-200"
                            onClick={() => {
                                openAuthDialog();
                                switchAuthView("login");
                            }}
                        >
                            Sign In
                        </button>
                        <button
                            className="text-sm rounded-xl px-4 py-2 font-semibold text-white bg-red-500 hover:scale-105 transition-transform duration-200 ease-in-out"
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

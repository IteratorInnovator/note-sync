import { PlayCircle, Github } from "lucide-react";

const Footer = () => {
    return (
        <footer className="border-t border-slate-200 bg-white/80 backdrop-blur">
            <div className="mx-auto max-w-7xl px-6 py-12">
                {/* Brand + tagline */}
                <div className="text-center">
                    <div className="inline-flex items-center gap-2">
                        <PlayCircle className="h-6 w-6 text-red-500" />
                        <span className="text-xl font-bold text-red-600">
                            NoteSync
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-500">
                        Take timestamped notes while you watch. Learn faster,
                        retain more.
                    </p>
                </div>

                {/* Links */}
                <div className="mt-8 flex flex-col items-center justify-center gap-6 sm:flex-row">
                    <a
                        href="#features"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Features
                    </a>
                    <a
                        href="#how-it-works"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        How it works
                    </a>
                    <a
                        href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1&pp=ygUjbmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXAgcmljayBhc3RsZXmgBwE%3D"
                        target="_blank"
                        className="text-sm text-slate-600 hover:text-slate-900"
                    >
                        Demo
                    </a>
                </div>

                {/* Social */}
                <div className="mt-6 flex items-center justify-center gap-4">
                    <a
                        href="https://github.com/IteratorInnovator/note-sync"
                        target="_blank"
                        className="group rounded-full p-2 ring-1 ring-slate-200 hover:bg-slate-50"
                    >
                        <Github className="h-5 w-5 text-slate-600 group-hover:text-slate-900" />
                    </a>
                </div>

                {/* Bottom bar */}
                <div className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
                    <p>© {new Date().getFullYear()} NoteSync</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

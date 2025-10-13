import { Play } from "lucide-react";
import FadeInSection from "./ui/FadeInSection";

const Hero = ({ openAuthDialog }) => {
    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left */}
                    <FadeInSection direction="left" className="space-y-8 text-center lg:text-left">
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-500/30 bg-red-100 px-4 py-2 text-sm font-semibold text-red-500">
                            <Play className="w-5" />
                            Transform Your Video Learning
                        </span>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-center lg:text-left">
                            Take Notes{" "}
                            <span className="text-red-500">
                                While You Watch
                            </span>
                        </h1>

                        <p className="max-w-xl text-lg md:text-xl text-slate-500 text-center lg:text-left">
                            NoteSync revolutionizes video learning by letting
                            you create timestamp-linked notes directly alongside
                            your YouTube videos. Never lose track of important
                            moments again.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 sm:justify-center lg:justify-start">
                            <button
                                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-white bg-red-500 hover:scale-105 transition-transform duration-200 ease-in-out"
                                onClick={openAuthDialog}
                            >
                                Start Taking Notes Free
                                <span className="ml-2">→</span>
                            </button>
                            <a
                                href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ&start_radio=1&pp=ygUjbmV2ZXIgZ29ubmEgZ2l2ZSB5b3UgdXAgcmljayBhc3RsZXmgBwE%3D"
                                target="_blank"
                                className="inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold text-slate-900 bg-white ring-1 ring-slate-200 hover:text-white hover:bg-red-500 transition-colors duration-200 ease-out"
                            >
                                Watch Demo
                            </a>
                        </div>

                        <div className="flex items-center gap-8 pt-4 sm:gap-6 lg:gap-8 justify-center lg:justify-start">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">
                                    50K+
                                </p>
                                <p className="text-sm text-slate-500">
                                    Active Users
                                </p>
                            </div>
                            <div className="h-12 w-px bg-slate-200" />
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">
                                    1M+
                                </p>
                                <p className="text-sm text-slate-500">
                                    Notes Created
                                </p>
                            </div>
                            <div className="h-12 w-px bg-slate-200" />
                            <div className="text-center">
                                <p className="text-2xl font-bold text-slate-900">
                                    4.9/5
                                </p>
                                <p className="text-sm text-slate-500">
                                    User Rating
                                </p>
                            </div>
                        </div>
                    </FadeInSection>

                    {/* Right */}
                    <FadeInSection direction="right" className="relative">
                        <div className="relative ml-auto max-w-[640px] rounded-[28px] overflow-hidden shadow-2xl ring-1 ring-black/5">
                            <img
                                src="/src/assets/hero-image.png"
                                alt="YouTube on a laptop with timestamp notes"
                                className="block w-full h-auto"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white/20 to-transparent" />
                        </div>
                    </FadeInSection>
                </div>
            </div>
        </section>
    );
};

export default Hero;

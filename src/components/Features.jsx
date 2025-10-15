import { Clock, BookOpen, Zap, Search } from "lucide-react";
import FadeInSection from "./ui/FadeInSection";

const features = [
    {
        icon: Search,
        title: "Powerful Search",
        description:
            "Search across all your notes and jump directly to relevant video moments.",
    },
    {
        icon: Clock,
        title: "Timestamp Linking",
        description:
            "Every note is automatically linked to the exact moment in the video, making review effortless.",
    },
    {
        icon: BookOpen,
        title: "Smart Organization",
        description:
            "Organize your notes by topic, playlist, or course. Find what you need instantly.",
    },
    {
        icon: Zap,
        title: "Real-time Sync",
        description:
            "Your notes sync across all devices in real-time. Pick up right where you left off.",
    },
];

const Features = () => {
    return (
        <section
            id="features"
            className="py-20 md:py-32 bg-[var(--gradient-subtle)]"
        >
            <div className="container mx-auto px-4">
                <FadeInSection className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Everything You Need for{" "}
                        <span className="text-red-500">Video Learning</span>
                    </h2>
                    <p className="text-lg text-slate-500">
                        Powerful features designed to enhance your learning
                        experience and boost productivity.
                    </p>
                </FadeInSection>

                <div className="grid md:grid-cols-2 gap-6">
                    {features.map((feature, index) => (
                        <FadeInSection
                            key={index}
                            hiddenClassName={`opacity-0 translate-y-4 md:translate-y-0 ${index % 2 === 0 ? "md:-translate-x-6" : "md:translate-x-6"}`}
                            visibleClassName="opacity-100 translate-y-0 md:translate-x-0"
                            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-300 hover:shadow-md hover:scale-[1.02]"
                        >
                            <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-b from-red-500 to-red-600 ring-1 ring-white/70 ring-inset shadow-sm">
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>

                            <h3 className="mb-2 text-xl font-semibold text-slate-900">
                                {feature.title}
                            </h3>
                            <p className="text-slate-500">
                                {feature.description}
                            </p>
                        </FadeInSection>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;

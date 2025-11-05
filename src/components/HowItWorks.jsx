import { ArrowRight } from "lucide-react";

const steps = [
    {
        number: "01",
        title: "Find Your Lecture",
        description:
            "Search for your desired YouTube lecture — or just paste the link.",
    },
    {
        number: "02",
        title: "Watch & Take Notes",
        description:
            "As you watch, create notes that automatically link to the current timestamp.",
    },
    {
        number: "03",
        title: "Review Key Points",
        description:
            "Access all your notes in one place and revisit key moments anytime.",
    },
];

const HowItWorks = ({ openAuthDialog }) => {
    return (
        <section id="how-it-works" className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                        Simple, Powerful,{" "}
                        <span className="text-red-500">Effective</span>
                    </h2>
                    <p className="text-lg text-slate-500">
                        Get started in three easy steps and transform how you
                        learn from videos.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-10 md:gap-8 mb-12">
                    {steps.map((step, index) => (
                        <div key={index} className="relative text-center">
                            <div className="relative inline-grid h-20 w-20 place-items-center rounded-full bg-red-500 text-white text-2xl font-bold">
                                {String(step.number).padStart(2, "0")}
                            </div>

                            <h3 className="mt-6 text-2xl font-semibold text-slate-900">
                                {step.title}
                            </h3>
                            <p className="mt-2 text-slate-500">
                                {step.description}
                            </p>
                            {index < steps.length - 1 && (
                                <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-red-500 to-transparent" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <button
                        className="text-md rounded-xl px-10 py-3 font-semibold text-white bg-red-500 hover:scale-105 transition-transform duration-200 ease-in-out"
                        onClick={openAuthDialog}
                    >
                        Try NoteSync Now
                        <ArrowRight className="inline-block ml-2" />
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;

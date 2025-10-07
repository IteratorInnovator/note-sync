import { ArrowRight, Sparkles } from "lucide-react";

const CTA = ({ openAuthDialog, switchAuthView }) => {
    return (
        <section className="py-20 md:py-32 relative overflow-hidden">
            {/* Background with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(0,100%,50%)] to-[hsl(0,100%,60%)] -z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)] -z-10" />

            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto text-center text-primary-foreground">
                    <div className="text-white inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6 border border-white/20">
                        <Sparkles className="h-4 w-4" />
                        Join 50,000+ Learners Today
                    </div>

                    <h2 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                        Ready to Transform Your Video Learning?
                    </h2>

                    <p className="text-white/90 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                        Start taking timestamped notes on your favorite YouTube
                        videos today. No credit card required.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            className="px-8 py-3 rounded-xl bg-white text-red-500 font-semibold hover:bg-white/90 border-white/20 group"
                            onClick={() => {
                                openAuthDialog();
                                switchAuthView("signup");
                            }}
                        >
                            Get Started Free
                            <ArrowRight className="inline-block ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>

                    <p className="text-sm text-white/70 mt-6">
                        Free forever. No credit card required. Premium features
                        available.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default CTA;

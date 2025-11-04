import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "..";
import FeatureCard from "../components/ui/FeatureCard";
import FeatureModal from "../components/FeatureModal";
import { features } from "../utils/features";
import { ArrowRight } from "lucide-react";

const Home = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        // Trigger animations on mount
        setIsVisible(true);
    }, []);

    return (
        <div className="relative min-h-screen">
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
                {/* Hero Section with improved hierarchy and animations */}
                <div className="text-center space-y-6 mb-16 lg:mb-24">
                    <div className="space-y-3">
                        {/* Welcome text - fade in from top */}
                        <p
                            className={`text-sm font-medium text-red-500 uppercase tracking-wider transition-all duration-700 ${
                                isVisible
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-4"
                            }`}
                            style={{ transitionDelay: "100ms" }}
                        >
                            Welcome to NoteSync, {user?.displayName || "User"}
                        </p>

                        {/* Main heading - fade in and scale */}
                        <h1
                            className={`text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight transition-all duration-700 ${
                                isVisible
                                    ? "opacity-100 scale-100"
                                    : "opacity-0 scale-95"
                            }`}
                            style={{ transitionDelay: "200ms" }}
                        >
                            Your Video Learning
                            <span
                                className={`block text-red-500 mt-2 transition-all duration-700 ${
                                    isVisible
                                        ? "opacity-100 translate-x-0"
                                        : "opacity-0 -translate-x-4"
                                }`}
                                style={{ transitionDelay: "400ms" }}
                            >
                                Companion
                            </span>
                        </h1>
                    </div>

                    {/* Description - fade in */}
                    <p
                        className={`text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed transition-all duration-700 ${
                            isVisible
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4"
                        }`}
                        style={{ transitionDelay: "500ms" }}
                    >
                        Capture YouTube discoveries, sync detailed notes, and
                        build playlists that keep your learning organized and
                        ready to revisit
                    </p>

                    {/* Primary CTA - fade in and scale */}
                    <div
                        className={`pt-4 sm:pt-6 transition-all duration-700 ${
                            isVisible
                                ? "opacity-100 scale-100"
                                : "opacity-0 scale-90"
                        }`}
                        style={{ transitionDelay: "600ms" }}
                    >
                        <button
                            onClick={() => navigate("/videos")}
                            className="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-3.5 md:py-4 bg-red-500 text-white text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-105 hover:-translate-y-1 overflow-hidden active:scale-100 active:translate-y-0"
                        >
                            {/* Animated gradient background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

                            {/* Ripple effect on hover */}
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl bg-white/10 scale-0 group-hover:scale-100 transition-transform duration-500"></div>

                            {/* Content */}
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                <span>Start Learning Now</span>
                                <ArrowRight
                                    strokeWidth={3}
                                    className="inline-block size-4 sm:size-5 transition-all duration-300 group-hover:translate-x-1"
                                />
                            </span>

                            {/* Glow effect */}
                            <div className="absolute -inset-1 bg-red-400/20 rounded-xl sm:rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
                        </button>

                        {/* Helper text for mobile */}
                        <p className="mt-3 text-xs sm:text-sm text-gray-500 text-center md:hidden">
                            Tap to begin your journey
                        </p>
                    </div>
                </div>

                {/* Features Section with improved spacing and animations */}
                <div className="space-y-8">
                    {/* Section heading - fade in */}
                    <div
                        className={`text-center transition-all duration-700 ${
                            isVisible
                                ? "opacity-100 translate-y-0"
                                : "opacity-0 translate-y-4"
                        }`}
                        style={{ transitionDelay: "700ms" }}
                    >
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                            Powerful Features
                        </h2>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Everything you need to enhance your learning journey
                        </p>
                    </div>

                    {/* Feature cards - staggered fade in from bottom */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mt-12">
                        {features.map((feature, index) => (
                            <div
                                key={feature.id}
                                className={`transition-all duration-700 ${
                                    isVisible
                                        ? "opacity-100 translate-y-0"
                                        : "opacity-0 translate-y-8"
                                }`}
                                style={{
                                    transitionDelay: `${800 + index * 150}ms`,
                                }}
                            >
                                <div className="transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
                                    <FeatureCard
                                        feature={feature}
                                        onClick={() =>
                                            setSelectedFeature(feature)
                                        }
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {selectedFeature && (
                <FeatureModal
                    feature={selectedFeature}
                    onClose={() => setSelectedFeature(null)}
                />
            )}
        </div>
    );
};

export default Home;

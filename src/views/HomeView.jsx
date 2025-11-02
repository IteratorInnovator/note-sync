import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../";
import FeatureCard from "../components/ui/FeatureCard";
import FeatureModal from "../components/FeatureModal";
import { features } from "../utils/features";

const HomeView = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [selectedFeature, setSelectedFeature] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
        });
        return unsubscribe;
    }, []);

    return (
        <div className="space-y-10 max-w-6xl mx-auto px-4 py-8">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900">
                    Welcome {user?.displayName || "User"}
                </h2>
                <p className="text-gray-600">
                    Get started with NoteSync - your video learning companion
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {features.map((feature) => (
                    <FeatureCard
                        key={feature.id}
                        feature={feature}
                        onClick={() => setSelectedFeature(feature)}
                    />
                ))}
            </div>

            <div className="flex justify-center pt-4">
                <button
                    onClick={() => navigate("/search")}
                    className="px-8 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 hover:scale-105 transition-all duration-200 shadow-md"
                >
                    Start Learning
                </button>
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

export default HomeView;
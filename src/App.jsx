import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from ".";
import "./App.css";
import Index from "./pages/Index";
import Main from "./pages/Main";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { Loader2 } from "lucide-react";
import { DEFAULT_SETTINGS, useSettings } from "./stores/useSettings";
import { getUserSettings } from "./utils/firestore";

const FEDERATED_VERIFIED_PROVIDERS = new Set(["google.com", "github.com"]);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const getSettings = useSettings((state) => state.getSettings);
    const setSettings = useSettings((state) => state.setSettings);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) {
            setSettings(DEFAULT_SETTINGS);
            return;
        }

        void getSettings(() => getUserSettings(user.uid));
    }, [user, getSettings, setSettings]);

    if (loading) {
        return (
            <div className="grid min-h-screen place-items-center bg-slate-900 text-white">
                <div className="flex flex-coetUtems-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-white" aria-hidden="true" />
                    <p className="text-sm tracking-wide">Loading NoteSync...</p>
                </div>
            </div>
        );
    }

    const hasTrustedFederatedProvider =
        user?.providerData?.some(({ providerId }) =>
            FEDERATED_VERIFIED_PROVIDERS.has(providerId)
        ) ?? false;

    const isVerifiedUser =
        !!user && (user.emailVerified || hasTrustedFederatedProvider);

    return (
        <BrowserRouter>
            <Routes>
                {/* Root route. If signed in, redirect to /videos. Else show landing page. */}
                <Route
                    path="/"
                    element={isVerifiedUser ? <Navigate to="/videos" /> : <Index />}
                />
                <Route
                    path="/reset-password"
                    element={ <ResetPasswordPage /> }
                />

                {/* Private routes. Only for signed-in users. Otherwise send to root. */}
                <Route
                    path="/videos"
                    element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/search"
                    element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/playlists"
                    element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/settings"
                    element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/watch/:videoId"
                    element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
                />

                {/* Catch-all. Redirect unknown paths based on auth state. */}
                <Route
                    path="*"
                    element={<Navigate replace to={isVerifiedUser ? "/videos" : "/"} />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

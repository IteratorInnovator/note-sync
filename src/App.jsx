import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useSearchParams } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from ".";
import "./App.css";
import Index from "./pages/Index";
import Main from "./pages/Main";
import Home from "./pages/Home";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { Loader2 } from "lucide-react";
import { DEFAULT_SETTINGS, useSettings } from "./stores/useSettings";
import { getUserSettings } from "./utils/firestore";

const FEDERATED_VERIFIED_PROVIDERS = new Set(["google.com", "github.com"]);

function AppContent() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const getSettings = useSettings((state) => state.getSettings);
    const setSettings = useSettings((state) => state.setSettings);

    const [searchParams] = useSearchParams();
    const mode = searchParams.get("mode");

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
                <div className="flex flex-col items-center gap-4">
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
        <Routes>
            {/* Root route. If signed in, redirect to /videos. Else show landing page. */}
            <Route
                path="/"
                element={
                    mode === "resetPassword" ? (
                        <ResetPasswordPage />
                    ) : mode === "verifyEmail" ? (
                        <VerifyEmailPage />
                    ) : isVerifiedUser ? (
                        <Navigate to="/home" />
                    ) : (
                        <Index />
                    )
                }
            />
            
            {/* Private routes. Only for signed-in users. Otherwise send to root. */}
            <Route
                path="/videos"
                element={isVerifiedUser ? <Main /> : <Navigate to="/" />}
            />
            <Route
                path="/home"
                element={isVerifiedUser ? <Home /> : <Navigate to="/" />}
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
                element={<Navigate replace to={isVerifiedUser ? "/home" : "/"} />}
            />
        </Routes>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;
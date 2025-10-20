import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from ".";
import "./App.css";
import Index from "./pages/Index";
import Main from "./pages/Main";

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(
        () =>
            onAuthStateChanged(auth, (u) => {
                setUser(u);

                setLoading(false);
            }),
        []
    );
    

    if (loading) return null;

    return (
        <BrowserRouter>
            <Routes>
                {/* Root route. If signed in, redirect to /videos. Else show landing page. */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/videos" /> : <Index />}
                />

                {/* Private routes. Only for signed-in users. Otherwise send to root. */}
                <Route
                    path="/videos"
                    element={user ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/search"
                    element={user ? <Main /> : <Navigate to="/" />}
                />
                <Route
                    path="/settings"
                    element={user ? <Main /> : <Navigate to="/" />}
                />

                {/* Catch-all. Redirect unknown paths based on auth state. */}
                <Route
                    path="*"
                    element={<Navigate replace to={user ? "/videos" : "/"} />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

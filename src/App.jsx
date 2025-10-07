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
                {/* Root route. If signed in, redirect to /main. Else show landing page. */}
                <Route
                    path="/"
                    element={user ? <Navigate to="/main" replace /> : <Index />}
                />

                {/* Private route. Only for signed-in users. Otherwise send to root. */}
                <Route
                    path="/main"
                    element={user ? <Main /> : <Navigate to="/" replace />}
                />

                {/* Catch-all. Redirect unknown paths based on auth state. */}
                <Route
                    path="*"
                    element={<Navigate replace to={user ? "/main" : "/"} />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import LoginModal from "./LoginModal";
import SignUpModal from "./SignUpModal";
import ForgotPasswordModal from "./ForgotPasswordModal.jsx";

const AuthDialog = ({ closeAuthDialog, view, switchAuthView }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setShow(true);
    }, []);

    const closeAnimation = () => {
        setShow(false);
        setTimeout(() => {
            closeAuthDialog();
        }, 200);
    };

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && closeAuthDialog();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [closeAuthDialog]);

    return (
        <div
            className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4
                  transition-opacity duration-200
                  ${show ? "opacity-100" : "opacity-0"}`}
            onClick={closeAnimation}
        >
            <div
                className={`relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl flex flex-col gap-1
                    transition duration-200
                    ${show ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    onClick={closeAnimation}
                    className="absolute right-3 top-3 inline-grid h-5 w-5 place-items-center rounded-full hover:text-black active:outline-none active:ring-2 active:ring-red-500 group"
                >
                    <X className="h-4 w-4 text-slate-500 group-hover:text-black" />
                </button>

                {view === "login" && (
                    <LoginModal
                        switchToSignUpView={() => switchAuthView("signup")}
                        switchToForgotPasswordView={() => switchAuthView("forgotPassword")}
                    />
                )}
                {view === "signup" && (
                    <SignUpModal
                        switchToLoginView={() => switchAuthView("login")}
                    />
                )}
                {view === "forgotPassword" && (
                    <ForgotPasswordModal
                        switchToLoginView={() => switchAuthView("login")}
                    />
                )}
            </div>
        </div>
    );
};

export default AuthDialog;

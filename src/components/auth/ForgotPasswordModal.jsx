import React, { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../index.js";
import User from "../../assets/user.svg";
import { useToasts } from "../../stores/useToasts";
import { Mail, MailX } from "lucide-react";

const ForgotPasswordModal = ({ switchToLoginView }) => {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const { addToast } = useToasts();

    const handleReset = async (event) => {
        event.preventDefault();

        if (!email.trim()) {
            setError("Please enter your email address.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim().toLowerCase());
            addToast({
                message:
                    "Password reset email sent. Check your inbox.",
                Icon: Mail,
                iconColour: "text-emerald-400",
            });
        } catch (error) {
            addToast({
                message:
                    "Failed to send reset email. Please try again.",
                Icon: MailX,
                iconColour: "text-red-400",
            });
            console.log(error);
            return;
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <h2 className="text-slate-600 text-sm mb-4">
                Enter your email to receive a password reset link.
            </h2>
            <form onSubmit={handleReset} className="flex flex-col gap-4">
                <div className="flex flex-col w-full space-y-4">
                    <div className="relative">
                        <input
                            type="email"
                            name="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="Enter your email"
                            autoComplete="email"
                            className="text-sm w-full rounded-xl border border-slate-200 pl-10 pr-3 py-2
                                           focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <img
                            src={User}
                            alt=""
                            className="w-[1.25em] pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                        />
                    </div>
                    {error && (
                        <p className="text-sm text-red-400 pl-2 mt-1">
                            {error}
                        </p>
                    )}
                </div>
                <button
                    type="submit"
                    className="text-sm text-center px-6 py-2.5 mt-2 rounded-xl bg-red-500 text-white font-semibold w-full cursor-pointer hover:scale-105 transition-transform duration-200 ease-in-out"
                >
                    Send Reset Email
                </button>
            </form>

            <div className="text-sm text-center text-slate-500 mt-2">
                <button
                    className="text-red-500 hover:underline"
                    onClick={switchToLoginView}
                >
                    Back to Login
                </button>
            </div>
        </>
    );
};

export default ForgotPasswordModal;

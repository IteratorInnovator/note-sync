import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import GoogleButton from "../ui/GoogleButton.jsx";
import GithubButton from "../ui/GithubButton.jsx";
import Separator from "../ui/Separator.jsx";
import { auth } from "../../index.js";
import {
    fetchSignInMethodsForEmail,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { AUTH_ERRORS, fallbackError } from "../../utils/constants.js";
import User from "../../assets/user.svg";
import EyeOff from "../../assets/eye-off.svg";
import EyeShow from "../../assets/eye-show.svg";

const LoginModal = ({ switchToSignUpView, switchToForgotPasswordView }) => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => {
        setShowPassword(!showPassword);
    };
    const [error, setError] = useState({
        type: "",
        message: "",
    });

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();

        const credentials = new FormData(event.currentTarget);
        const email = credentials.get("email");
        const password = credentials.get("password");

        try {
            const { user } = await signInWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password.trim()
            );
            if (!user.emailVerified) {
                setError({
                    type: "email",
                    message:
                        "Verify your email to sign in.",
                });
                return;
            }
            // success: redirect to main page
            navigate("/home");
        } catch (err) {
            fetchSignInMethodsForEmail(auth, email).then((methods) => {
                if (methods.includes("google.com")) {
                    setError({
                        type: "email",
                        message: "Login with Google for this email.",
                    });
                    return;
                }
                setError(AUTH_ERRORS[err.code] || fallbackError);
            });
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <h2 className="text-slate-600 text-sm">
                Sign in to your NoteSync account to continue
            </h2>

            {/* Buttons to sign in using OAuth */}
            <div className="flex justify-center gap-3 w-full mt-6 mb-2">
                <GoogleButton text="Google"></GoogleButton>
                <GithubButton text="Github"></GithubButton>
            </div>
            {/* Divider */}
            <div className="flex items-center gap-2 w-full my-2">
                <Separator />
                <p className="text-slate-500 text-xs">OR CONTINUE WITH</p>
                <Separator />
            </div>
            {/* Conventional login using email and password */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col w-full space-y-4">
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Email</h3>
                        <div className="relative">
                            <input
                                type="email"
                                name="email"
                                placeholder="Enter email"
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
                        {error.message && error.type === "email" && (
                            <p className="text-sm text-red-400 pl-2 mt-1">
                                {error.message}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col">
                        <h3 className="text-sm font-semibold mb-2">Password</h3>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                autoComplete="current-password"
                                placeholder="Enter password"
                                className="text-sm w-full rounded-xl border border-gray-200 py-2 pl-3 pr-10
                   focus:outline-none focus:ring-2 focus:ring-red-500"
                            />

                            {/* * Password visibility toggle (conditional rendering)
                             *
                             * Purpose
                             * - Shows a button inside the password field to toggle between masked and plain text.
                             * - The icon updates based on the current visibility state.
                             *
                             * Dependencies
                             * - state: `showPassword: boolean`   // true => password is visible
                             * - handler: `togglePassword()`      // flips `showPassword`
                             *
                             * Render logic
                             * - The button is always rendered.
                             * - Inside the button, the icon is chosen conditionally:
                             *     showPassword === true  -> show "eye-off" (meaning: click to hide)
                             *     showPassword === false -> show "eye"     (meaning: click to show)
                             * - Note: In your original snippet the mapping was reversed (eye-off when hidden).
                             *   Align the icon with the *action* you want users to take.
                             *
                             * */}
                            <button
                                type="button"
                                onClick={togglePassword}
                                className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 grid place-items-center"
                            >
                                <img
                                    src={!showPassword ? EyeOff : EyeShow}
                                    className="h-4 w-4 text-slate-500"
                                    alt=""
                                />
                            </button>
                        </div>
                        {error.message && error.type === "password" && (
                            <p className="text-sm text-red-400 pl-2 mt-1">
                                {error.message}
                            </p>
                        )}
                        {/* Forget Password button */}
                        <button
                            type="button"
                            className="self-end w-auto text-[0.8rem] text-slate-900 font-medium mt-2 hover:underline"
                            onClick={switchToForgotPasswordView}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </div>

                {/* Sign in button */}
                <button
                    type="submit"
                    className="text-sm text-center px-6 py-2.5 mt-2 rounded-xl bg-red-500 text-white font-semibold w-full cursor-pointer hover:scale-105 transition-transform duration-200 ease-in-out"
                >
                    Sign In
                </button>
            </form>

            {/* Link to sign in modal */}
            <div className="text-sm text-center text-slate-500 mt-2">
                Don't have an account?{" "}
                <button
                    className="text-red-500 hover:underline"
                    onClick={switchToSignUpView}
                >
                    Sign up
                </button>
            </div>
        </>
    );
};

export default LoginModal;

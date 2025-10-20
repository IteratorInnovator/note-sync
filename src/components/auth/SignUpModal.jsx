import React, { useEffect, useState } from "react";
import GoogleButton from "../ui/GoogleButton";
import FacebookButton from "../ui/FacebookButton";
import Separator from "../ui/Separator";
import CriteriaItem from "../ui/CriteriaItem";
import { auth } from "../..";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import { AUTH_ERRORS, fallbackError } from "../../utils/constants";
import User from "../../assets/user.svg";
import EyeOff from "../../assets/eye-off.svg";
import EyeShow from "../../assets/eye-show.svg";

const SignUpModal = ({ switchToLoginView }) => {
    const [showPassword, setShowPassword] = useState(false);
    const togglePassword = () => setShowPassword((s) => !s);

    const [credentials, setCredentials] = useState({
        email: "",
        password: "",
    });

    const [passwordCriteria, setPasswordCriteria] = useState({
        minLength: false,
        uppercase: false,
        lowercase: false,
        number: false,
    });
    const [error, setError] = useState({
        type: "",
        message: "",
    });

    // keep criteria in sync with password
    useEffect(() => {
        const pwd = credentials.password || "";
        setPasswordCriteria({
            minLength: pwd.length >= 8,
            uppercase: /[A-Z]/.test(pwd),
            lowercase: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
        });
    }, [credentials.password]);

    // handle controlled inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCredentials((prevFormData) => ({ ...prevFormData, [name]: value }));
    };

    const handleSignUp = async (event) => {
        event.preventDefault();

        const credentials = new FormData(event.currentTarget);

        const email = credentials.get("email");
        const password = credentials.get("password");

        try {
            const { user } = await createUserWithEmailAndPassword(
                auth,
                email.trim().toLowerCase(),
                password.trim()
            );
            await sendEmailVerification(user);
            alert(
                "Email verification link sent. Verify to activate your account."
            );
            switchToLoginView();
        } catch (err) {
            setError(AUTH_ERRORS[err.code] || fallbackError);
        }
    };

    return (
        <>
            <h1 className="text-2xl font-bold">Create Your Account</h1>
            <h2 className="text-slate-600 text-sm">
                Get started with NoteSync
            </h2>

            {/* OAuth */}
            <div className="flex justify-center gap-3 w-full mt-6 mb-2">
                <GoogleButton text="Google" />
                <FacebookButton text="Facebook" />
            </div>

            {/* Divider */}
            <div className="flex items-center gap-2 w-full my-2">
                <Separator />
                <p className="text-slate-500 text-xs">OR CONTINUE WITH</p>
                <Separator />
            </div>

            {/* Conventional sign up usin email and password */}
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
                <div className="flex flex-col w-full space-y-4">
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Email</h3>
                        <div className="relative">
                            <input
                                required
                                type="email"
                                name="email"
                                placeholder="Enter email"
                                onChange={handleChange}
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
                    <div>
                        <h3 className="mb-2 text-sm font-semibold">Password</h3>
                        <div className="relative">
                            <input
                                required
                                type={showPassword ? "text" : "password"}
                                name="password"
                                placeholder="Enter password"
                                onChange={handleChange}
                                autoComplete="new-password"
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
                                    src={
                                        !showPassword
                                            ? EyeOff
                                            : EyeShow
                                    }
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
                    </div>
                </div>

                {/* * Password Criteria Feedback
                 *
                 * What it does
                 * - Shows a live checklist under the password field so users see which rules they already meet.
                 * - Reduces guesswork and prevents form errors by giving immediate, specific guidance.
                 *
                 * When it appears
                 * - Hidden by default.
                 * - Becomes visible once the user types at least one character in the password field.
                 * - Updates on every keystroke and paste action.
                 *
                 * Rules shown in the UI
                 * - At least 8 characters
                 * - At least 1 uppercase letter (A–Z)
                 * - At least 1 lowercase letter (a–z)
                 * - At least 1 number (0–9)
                 * */}
                {credentials.password && (
                    <div className="border border-slate-200 shadow-xs p-3 rounded-lg space-y-1 w-full">
                        <p className="text-sm font-medium">
                            Password must contain:
                        </p>
                        <CriteriaItem satisfied={passwordCriteria.minLength}>
                            At least 8 characters
                        </CriteriaItem>
                        <CriteriaItem satisfied={passwordCriteria.uppercase}>
                            One uppercase letter
                        </CriteriaItem>
                        <CriteriaItem satisfied={passwordCriteria.lowercase}>
                            One lowercase letter
                        </CriteriaItem>
                        <CriteriaItem satisfied={passwordCriteria.number}>
                            One number
                        </CriteriaItem>
                    </div>
                )}

                {/* * Create Account Button
                 *
                 * What it does
                 * - Submits the form to create an account.
                 * - Stays disabled until requirements are met to prevent invalid submits.
                 *
                 * Disabled when
                 * - Any password criterion in `passwordCriteria` is false.
                 * - `credenials.email` is empty.
                 * - `credentials.password` is empty.
                 *
                 * Enabled when
                 * - All values in `passwordCriteria` are true AND both fields are non-empty.
                 * */}
                <input
                    type="submit"
                    value="Create account"
                    disabled={
                        !Object.values(passwordCriteria).every(Boolean) ||
                        !credentials.email ||
                        !credentials.password
                    }
                    className="text-sm text-center px-6 py-2.5 mt-2 rounded-xl bg-red-500 text-white font-semibold w-full enabled:cursor-pointer enabled:hover:scale-105 transition-transform duration-200 ease-in-out disabled:cursor-not-allowed disabled:opacity-50"
                />
            </form>

            {/* Link to log in modal */}
            <div className="text-sm text-center text-slate-500 mt-2">
                Already have an account?{" "}
                <button
                    className="text-red-500 hover:underline"
                    onClick={switchToLoginView}
                >
                    Sign in
                </button>
            </div>
        </>
    );
};

export default SignUpModal;

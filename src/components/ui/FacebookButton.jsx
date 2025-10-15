import React from "react";
import { useNavigate } from "react-router-dom";
import { auth, FacebookProvider } from "../..";
import { signInWithPopup, signInWithRedirect } from "firebase/auth";

const FacebookButton = ({ text }) => {
    const navigate = useNavigate();

    const signUpOrLoginWithFacebook = async () => {
        try {
            await signInWithPopup(auth, FacebookProvider);
            navigate("/videos");
        } catch (err) {
            if (
                err.code === "auth/popup-closed-by-user" ||
                err?.code === "auth/cancelled-popup-request"
            ) {
                return;
            }
            if (err.code === "auth/popup-blocked") {
                // if sign in with pop, trigger sign in with redirect instead
                await signInWithRedirect(auth, FacebookProvider);
                return;
            }
        }
    };
    return (
        <button
            type="button"
            onClick={() => {
                signUpOrLoginWithFacebook();
            }}
            className="bg-white px-8 py-2 rounded-lg shadow-xs w-full border border-slate-200 flex flex-wrap items-center justify-center gap-4 hover:bg-red-500 hover:text-white transition-colors duration-300 group"
        >
            <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <p className="text-xs md:text-sm text-slate-900 font-semibold group-hover:text-white group-hover:transition-colors group-hover:duration-300">
                {text}
            </p>
        </button>
    );
};

export default FacebookButton;

export const AUTH_ERRORS = {
    "auth/invalid-email": {
        type: "email",
        message: "Enter a valid email.",
    },
    "auth/email-already-in-use": {
        type: "email",
        message: "Email already in use.",
    },
    "auth/user-not-found": {
        type: "email",
        message: "No account for this email.",
    },
    "auth/user-disabled": { type: "email", message: "Account disabled." },
    "auth/missing-password": {
        type: "password",
        message: "Enter your password!",
    },
    "auth/invalid-credential": {
        type: "password",
        message: "Incorrect credentials.",
    },
    "auth/too-many-requests": {
        type: "password",
        message: "Too many attempts. Try later.",
    },
}

export const fallbackError = { type: "password", message: "Login failed." };

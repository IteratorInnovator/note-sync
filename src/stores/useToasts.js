import { create } from "zustand";

let nextToastId = 0;

const buildToast = (payload = {}) => {
    const {
        message = "",
        Icon = null,
        iconColour = "",
        duration = 3000,
    } = payload;

    return {
        id: nextToastId++,
        message,
        Icon,
        iconColour,
        duration,
    };
};

export const useToasts = create((set) => ({
    toasts: [],
    addToast: (payload) =>
        set((state) => ({
            toasts: [...state.toasts, buildToast(payload)],
        })),
    removeToast: (id) =>
        set((state) => ({
            toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
    clearToasts: () => set({ toasts: [] }),
}));

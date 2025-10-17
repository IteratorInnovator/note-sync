/**
 * Shared settings store.
 *
 * This hook exposes the user's app preferences across views.
 *  - Keep defaults in one place so new fields stay consistent.
 *  - Accept async callbacks so persistence can plug in (e.g., Firestore).
 *  - Optimistically update local state and roll back on failure.
 *
 * Example usage:
 * const { settings, loadSettings, updateSettings } = useSettings();
 * await getSettings(() => getUserSettings(uid));
 * await updateSettings((next) => updateUserSettings(uid, next), { safeSearch: "strict" });
 */

import { create } from "zustand";

export const DEFAULT_SETTINGS = {
    safeSearch: "moderate",
    videoDuration: "any",
};

export const useSettings = create((set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    getSettings: async (getUserSettings) => {
        try {
            const userSettings = await getUserSettings();
            set({ settings: { ...userSettings } });
        } catch {
            set({ settings: { ...DEFAULT_SETTINGS } });
        }
    },
    updateSettings: async (updateUserSettings, partial) => {
        const previous = get().settings;
        const next = { ...previous, ...partial };
        set({ settings: next });
        try {
            await updateUserSettings(next);
        } catch {
            set({ settings: previous });
        }
    },
    resetSettings: async (resetUserSettings) => {
        set({ settings: { ...DEFAULT_SETTINGS } });
        await resetUserSettings;
    },
}));

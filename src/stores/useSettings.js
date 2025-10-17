/**
 * Settings state manager (Zustand).
 *
 * Responsibilities:
 *  1. Maintain a single source of truth for user-level preferences inside the client.
 *  2. Ship sane defaults (`DEFAULT_SETTINGS`) so screens can render instantly.
 *  3. Let the UI provide persistence callbacks (Firestore, REST, etc.) without hard-coding them here.
 *  4. Favour optimistic updates—mutate local state first, roll back if the async write fails.
 *
 * Exposed API:
 *  - `settings`: snapshot of the current preference object.
 *  - `setSettings(payload)`: hard-set the entire settings object (rarely used; mainly for bootstrapping or tests).
 *  - `getSettings(loader)`: call with an async loader; merges defaults and handles errors internally.
 *  - `updateSettings(writer, partial)`: merges `partial` into state, invokes `writer(next)` and reverts on failure.
 *  - `resetSettings(resetFn)`: reverts to defaults locally, then awaits `resetFn` for server side cleanup.
 *
 * Example:
 * ```js
 * const { settings, getSettings, updateSettings, resetSettings } = useSettings();
 *
 * // hydrate on sign-in
 * await getSettings(() => fetchUserSettings(uid));
 *
 * // apply a change
 * await updateSettings(
 *   (next) => saveUserSettings(uid, next),
 *   { safeSearch: "strict" }
 * );
 *
 * // reset to defaults
 * await resetSettings(() => overwriteUserSettings(uid, DEFAULT_SETTINGS));
 * ```
 *
 * Notes:
 *  - Callers decide how to persist (Firestore, local storage, etc.) and pass those routines in.
 *  - Errors from loaders/writers are surfaced so the UI can react (toast, retry, etc.).
 */

import { create } from "zustand";

export const DEFAULT_SETTINGS = {
    safeSearch: "moderate",
    videoDuration: "any",
};

export const useSettings = create((set, get) => ({
    settings: { ...DEFAULT_SETTINGS },
    setSettings: (newSettings) => set({ settings: { ...newSettings } }),
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

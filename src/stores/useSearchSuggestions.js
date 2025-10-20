/**
 * =============================================================================
 * File: useSearchSuggestions.js
 * =============================================================================
 * Overview:
 *   Centralized zustand store that manages search suggestion state, network
 *   requests, and client-side caching. The store exposes a resilient API that
 *   prevents redundant YouTube queries by persisting results and reusing them
 *   across component mounts.
 *
 * Responsibilities:
 *   - Track the active query, loading flags, last resolved term, and any error.
 *   - Execute debounced suggestion fetches against `searchVideos`.
 *   - Cache up to 25 trimmed queries, limiting each suggestion payload to five
 *     lightweight entries that include title, channel metadata, and thumbnail.
 *   - Persist relevant state (`query`, `suggestions`, `lastResolved`, `cache`)
 *     so subsequent sessions immediately reuse cached responses.
 *   - Provide lifecycle helpers (`clearSuggestions`, `cancelRequest`) so UI
 *     layers can cleanly abort in-flight work during unmounts or resets.
 *
 * Key Behaviors:
 *   - Ignores empty/whitespace-only queries and resets state without issuing a
 *     network call.
 *   - Returns cached suggestions synchronously when available, eliminating API
 *     usage for repeat searches within the cache window.
 *   - Deduplicates suggestion titles and caps results at five items to keep the
 *     suggestion dropdown lightweight.
 *   - Automatically trims the cache to the most recent 25 entries to avoid
 *     unbounded storage growth.
 *
 * Extension Points:
 *   - `clearSuggestions`: reset transient state after sign-out or context
 *     changes.
 *   - `cancelRequest`: abort the active fetch during navigation or unmount.
 *   - `clearCache`: (if desired) add an action that sets `cache: {}` and
 *     optionally clears persistent storage via `useSearchSuggestions.persist`.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { searchVideos } from "../services/utils/youtube";

let activeController = null;

const MAX_CACHE_ENTRIES = 50;
const SUGGESTION_LIMIT = 5;

const trimCache = (cache) => {
    const keys = Object.keys(cache);
    if (keys.length <= MAX_CACHE_ENTRIES) return cache;

    const pruned = {};
    const start = keys.length - MAX_CACHE_ENTRIES;
    for (let i = start; i < keys.length; i++) {
        const key = keys[i];
        pruned[key] = cache[key];
    }
    return pruned;
};

export const useSearchSuggestions = create(
    persist(
        (set, get) => ({
            query: "",
            suggestions: [],
            loading: false,
            error: null,
            lastResolved: "",
            cache: {},
            requestSuggestions: async (rawTerm) => {
                const raw = rawTerm ?? "";
                const trimmed = raw.trim();

                const state = get();

                if (state.query !== raw) {
                    set({ query: raw });
                }

                if (!trimmed) {
                    if (activeController) {
                        activeController.abort();
                        activeController = null;
                    }
                    if (
                        state.query !== "" ||
                        state.suggestions.length !== 0 ||
                        state.loading ||
                        state.error !== null ||
                        state.lastResolved !== ""
                    ) {
                        set({
                            query: "",
                            suggestions: [],
                            loading: false,
                            error: null,
                            lastResolved: "",
                        });
                    }
                    return;
                }

                const cachedSuggestions = state.cache?.[trimmed];
                if (cachedSuggestions) {
                    if (
                        state.lastResolved !== trimmed ||
                        state.suggestions !== cachedSuggestions
                    ) {
                        set({
                            suggestions: cachedSuggestions,
                            loading: false,
                            error: null,
                            lastResolved: trimmed,
                        });
                    }
                    return;
                }

                if (activeController) {
                    activeController.abort();
                }

                const controller = new AbortController();
                activeController = controller;

                if (!state.loading || state.error) {
                    set({ loading: true, error: null });
                }

                try {
                    const results = await searchVideos(trimmed, {
                        signal: controller.signal,
                    });
                    const uniqueTitles = new Set();
                    const suggestions = [];

                    for (const item of results) {
                        const title = item.title?.trim();
                        if (!title || uniqueTitles.has(title)) continue;

                        uniqueTitles.add(title);
                        suggestions.push({
                            id: item.videoId,
                            title,
                            channelTitle: item.channelTitle ?? "",
                            thumbnail: item.thumbnail ?? null,
                        });

                        if (suggestions.length >= SUGGESTION_LIMIT) break;
                    }

                    if (controller === activeController) {
                        set((current) => {
                            const nextCache = trimCache({
                                ...current.cache,
                                [trimmed]: suggestions,
                            });

                            return {
                                suggestions,
                                loading: false,
                                error: null,
                                lastResolved: trimmed,
                                cache: nextCache,
                            };
                        });
                    }
                } catch (error) {
                    if (error?.name === "AbortError") return;

                    if (controller === activeController) {
                        set({
                            suggestions: [],
                            loading: false,
                            error,
                        });
                    }
                } finally {
                    if (controller === activeController) {
                        activeController = null;
                    }
                }
            },
            clearSuggestions: () => {
                if (activeController) {
                    activeController.abort();
                    activeController = null;
                }

                const state = get();

                if (
                    state.query === "" &&
                    state.suggestions.length === 0 &&
                    state.loading === false &&
                    state.error === null &&
                    state.lastResolved === ""
                ) {
                    return;
                }

                set({
                    query: "",
                    suggestions: [],
                    loading: false,
                    error: null,
                    lastResolved: "",
                });
            },
            cancelRequest: () => {
                if (activeController) {
                    activeController.abort();
                    activeController = null;
                }
            },
        }),
        {
            name: "search-suggestions",
            partialize: (state) => ({
                lastResolved: state.lastResolved,
                suggestions: state.suggestions,
                query: state.query,
                cache: state.cache,
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.loading = false;
                    state.error = null;
                    state.cache = state.cache || {};
                }
            },
        }
    )
);

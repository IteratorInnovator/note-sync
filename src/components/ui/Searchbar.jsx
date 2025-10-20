/**
 * =============================================================================
 * File: Searchbar.jsx
 * =============================================================================
 * Overview:
 *   Controlled search input that coordinates user typing, debounced suggestion
 *   fetching, and explicit search submissions. The component connects to the
 *   `useSearchSuggestions` store to surface cached suggestions, manage loading
 *   state, and gracefully abort pending work when unmounted.
 *
 * Responsibilities:
 *   - Maintain UI-only state (`searchLoading`, `isFocused`) while deferring
 *     suggestion data to the store.
 *   - Debounce user input (750 ms) and invoke `requestSuggestions` only when
 *     the field is focused and non-empty.
 *   - Submit searches immediately on form submission or suggestion selection,
 *     aborting the previous request via an AbortController for fresh results.
 *   - Render a suggestion dropdown that displays titles, channel metadata, and
 *     thumbnails, handling loading, empty, and error presentation states.
 *
 * Integration Notes:
 *   - The parent component must control `value`, `onChange`, and `onResults`
 *     so that search results stay in sync with the broader application state.
 *   - Suggestions remain visible only while the input retains focus; blur
 *     gestures schedule the dropdown to hide after click handlers execute.
 *   - Cleanup hooks ensure in-flight fetches and store-side requests are
     cancelled to avoid React Strict Mode warnings.
 */


import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchVideos } from "../../utils/youtube.js";
import { useDebounce } from "../../hooks/useDebounce.js";
import { useSearchSuggestions } from "../../stores/useSearchSuggestions.js";

const Searchbar = ({ value = "", onChange, onResults }) => {
    const [searchLoading, setSearchLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const suggestions = useSearchSuggestions((state) => state.suggestions);
    const suggestionsLoading = useSearchSuggestions((state) => state.loading);
    const error = useSearchSuggestions((state) => state.error);
    const requestSuggestions = useSearchSuggestions(
        (state) => state.requestSuggestions
    );
    const clearSuggestions = useSearchSuggestions(
        (state) => state.clearSuggestions
    );
    const cancelSuggestions = useSearchSuggestions(
        (state) => state.cancelRequest
    );

    /**
     * One abort controller stored between searches so we can cancel the last request.
     * Why: when a new search starts, cancel the previous request to avoid stale results.
     */
    const acRef = useRef(null);

    const runSearch = useCallback(
        async (term) => {
            /**
             * Runs a YouTube search.
             * - Cancels the previous request if a new search starts.
             * - Shows loading while the request is in progress.
             * - Sends results to `onResults`. On any error (except abort) sends an empty list.
             */
            const trimmed = term.trim();
            if (!trimmed) return;

            if (acRef.current) acRef.current.abort();
            acRef.current = new AbortController();

            clearSuggestions();
            setIsFocused(false);
            setSearchLoading(true);

            try {
                const items = await searchVideos(trimmed, {
                    signal: acRef.current.signal,
                });
                onResults?.(items);
            } catch (e) {
                if (e?.name === "AbortError") return;
                console.log(e);
                onResults?.([]);
            } finally {
                setSearchLoading(false);
            }
        },
        [clearSuggestions, onResults]
    );

    const debouncedSuggestions = useCallback(() => {
        if (!isFocused) return;
        const trimmed = value.trim();
        if (!trimmed) {
            clearSuggestions();
            return;
        }
        requestSuggestions(trimmed);
    }, [value, requestSuggestions, clearSuggestions, isFocused]);

    useDebounce(debouncedSuggestions, [value], 750);

    useEffect(() => {
        clearSuggestions();
    }, [clearSuggestions]);

    useEffect(() => {
        return () => {
            if (acRef.current) {
                acRef.current.abort();
            }
            cancelSuggestions();
        };
    }, [cancelSuggestions]);

    const onSubmit = (e) => {
        e.preventDefault();

        /**
         * Trim away any whitespace from the query term
         * Run search only if trimmed query term is not empty
         */
        const term = value.trim();
        if (term) runSearch(term);
    };

    const handleChange = (nextValue) => {
        onChange?.(nextValue);
        if (!isFocused) setIsFocused(true);
    };

    const handleSuggestionClick = (suggestion) => {
        onChange?.(suggestion.title);
        runSearch(suggestion.title);
    };

    const shouldShowSuggestions =
        isFocused &&
        value.trim() &&
        (suggestions.length > 0 || suggestionsLoading || error);

    return (
        <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
                type="text"
                value={value}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter")
                        e.currentTarget.form?.requestSubmit();
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    // defer hiding suggestions so clicks register
                    requestAnimationFrame(() => setIsFocused(false));
                }}
                placeholder="Search videos..."
                className="w-full h-10 pl-10 pr-10 rounded-full border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
                autoComplete="off"
                disabled={searchLoading}
            />
            {/* keeps Enter-to-submit reliable even inside complex parents */}
            <button type="submit" className="sr-only">
                Search
            </button>

            {searchLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-slate-500" />
            )}

            {shouldShowSuggestions && (
                <div
                    className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden z-20"
                    onMouseDown={(event) => event.preventDefault()}
                >
                    {suggestionsLoading ? (
                        <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                            <Loader2 className="size-4 animate-spin" />
                            Fetching suggestions...
                        </div>
                    ) : null}

                    {!suggestionsLoading && error ? (
                        <div className="px-4 py-3 text-sm text-red-500">
                            Failed to load suggestions.
                        </div>
                    ) : null}

                    {!suggestionsLoading &&
                    !error &&
                    suggestions.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-slate-500">
                            No suggestions yet.
                        </div>
                    ) : null}

                    {!suggestionsLoading && suggestions.length > 0 ? (
                        <ul>
                            {suggestions.map((suggestion) => (
                                <li
                                    key={`${suggestion.id}-${suggestion.title}`}
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSuggestionClick(suggestion)
                                        }
                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 focus:bg-slate-100"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0">
                                                <span className="block font-medium truncate">
                                                    {suggestion.title}
                                                </span>
                                                {suggestion.channelTitle ? (
                                                    <span className="text-xs text-slate-500 truncate">
                                                        {suggestion.channelTitle}
                                                    </span>
                                                ) : null}
                                            </div>
                                            {suggestion.thumbnail ? (
                                                <img
                                                    src={suggestion.thumbnail}
                                                    alt=""
                                                    className="h-10 w-16 flex-shrink-0 rounded-md object-cover"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            ) : null}
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : null}
                </div>
            )}
        </form>
    );
};

export default Searchbar;

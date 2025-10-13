// components/ui/Searchbar.jsx
import { useRef, useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { searchVideos } from "../../services/utils/youtube.js";

const Searchbar = ({ value = "", onChange, onResults }) => {
  const [loading, setLoading] = useState(false);

  /** 
   * One abort controller stored between searches so we can cancel the last request.
   * Why: when a new search starts, cancel the previous request to avoid stale results.
   */
  const acRef = useRef(null);

  
  async function runSearch(term) {
    /**
     * Runs a YouTube search.
     * - Cancels the previous request if a new search starts.
     * - Shows loading while the request is in progress.
     * - Sends results to `onResults`. On any error or cancel, sends an empty list.
     */
  
    // Cancel the in-flight request from the last search, if any.
    if (acRef.current) acRef.current.abort();

    // Store the new controller so the next call can abort this one.
    acRef.current = new AbortController();
    setLoading(true);
    try {
      const items = await searchVideos(term, { signal: acRef.current.signal });
      onResults?.(items);
    } catch (e) {
        console.log(e)
      onResults?.([]);
    } finally {
      setLoading(false);
    }
  }

  const onSubmit = (e) => {
    e.preventDefault();

    /**
     * Trim away any whitespace from the query term
     * Run search only if trimmed query term is not empty
     */
    const term = value.trim();
    if (term) runSearch(term);
  }

  return (
    <form onSubmit={onSubmit} className="relative max-w-2xl mx-auto">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.form?.requestSubmit();
        }}
        placeholder="Search videos…"
        className="w-full h-10 pl-10 pr-10 rounded-full border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
        autoComplete="off"
        disabled={loading}
      />
      {/* keeps Enter-to-submit reliable even inside complex parents */}
      <button type="submit" className="sr-only">Search</button>

      {loading && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 animate-spin text-slate-500" />
      )}
    </form>
  );
}

export default Searchbar;

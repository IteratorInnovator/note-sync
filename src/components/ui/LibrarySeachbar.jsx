import { Search } from "lucide-react";

const LibrarySearchbar = ({ value, onChange, placeholder}) => {
    return (
        <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full h-10 pl-10 pr-10 rounded-full border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-500 focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all"
            />
            {/* keeps Enter-to-submit reliable even inside complex parents */}
            <button type="submit" className="sr-only">
                Search
            </button>
        </div>
    );
}

export default LibrarySearchbar;

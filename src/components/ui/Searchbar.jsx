import { Search } from "lucide-react";

const Searchbar = () => {
    return (
        <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
                type="text"
                placeholder="Search your videos..."
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-white text-sm text-slate-500 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
            />
        </div>
    );
};

export default Searchbar;

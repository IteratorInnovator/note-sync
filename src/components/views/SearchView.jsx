import { useState } from "react";
import Searchbar from "../ui/Searchbar";
import VideoList from "../VideoList";

const SearchView = () => {
    const [results, setResults] = useState([]);

    return (
        <div className="space-y-4">
            <Searchbar onResults={setResults} />

            {results.length === 0 ? (
                <div className="text-sm text-slate-500">No results.</div>
            ) : (
                <VideoList videoList={results} />
            )}
        </div>
    );
};

export default SearchView;

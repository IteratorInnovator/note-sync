import Searchbar from "../ui/Searchbar";
import VideoList from "../VideoList";

const SearchView = ({
    searchTerm = "",
    onSearchTermChange,
    results = [],
    onResultsChange,
}) => {
    return (
        <div className="space-y-4">
            <Searchbar
                value={searchTerm}
                onChange={onSearchTermChange}
                onResults={onResultsChange}
            />

            {results.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                    <div className="text-2xl text-slate-500/60 text-center">No results</div>
                </div>
            ) : (
                <VideoList videoList={results} />
            )}
        </div>
    );
};

export default SearchView;

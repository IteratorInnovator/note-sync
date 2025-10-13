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
                <div className="text-sm text-slate-500">No results.</div>
            ) : (
                <VideoList videoList={results} />
            )}
        </div>
    );
};

export default SearchView;

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

            {results.length == 0 ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center md:text-lg text-slate-500/60">
                        Start searching to discover new videos.
                    </div>
                </div>
            ) : (
                <VideoList videoList={results} />
            )}
        </div>
    );
};

export default SearchView;

import { Grid2x2, Grid3x3, Rows } from "lucide-react";

const GridLayoutControls = ({ isMdUp, isCondensedLayout, setIsCondensedLayout }) => {
    const layoutOptions = isMdUp
        ? [
              { condensed: true, label: "2 Columns", Icon: Grid2x2 },
              { condensed: false, label: "3 Columns", Icon: Grid3x3 },
          ]
        : [
              { condensed: true, label: "1 Column", Icon: Rows },
              { condensed: false, label: "2 Columns", Icon: Grid2x2 },
          ];
    return (
        <div className="flex items-center gap-3">
            <div className="inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                {layoutOptions.map(({ condensed, label, Icon }, index) => {
                    const active = condensed === isCondensedLayout;
                    return (
                        <button
                            key={label}
                            type="button"
                            aria-label={label}
                            aria-pressed={active}
                            onClick={() => setIsCondensedLayout(condensed)}
                            className={`cursor-pointer flex h-9 w-9 items-center justify-center text-slate-400 transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-200 ${
                                active ? "bg-slate-100 text-slate-700" : ""
                            } ${index > 0 ? "border-l border-slate-200" : ""}`}
                        >
                            <Icon className="h-4 w-4" />
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default GridLayoutControls;

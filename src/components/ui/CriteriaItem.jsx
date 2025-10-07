const CriteriaItem = ({ satisfied, children }) => {
  const color = satisfied ? "text-green-500" : "text-gray-600";

  return (
    <div className={`flex items-center gap-2 ${color}`}>
      <svg
        viewBox="0 0 24 24"
        className="w-[1em] flex-shrink-0 transition-colors"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className="transition-colors text-sm">{children}</span>
    </div>
  );
};

export default CriteriaItem;

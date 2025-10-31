import { Plus } from "lucide-react";

const PlusButton = ({ onSave }) => {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSave?.();
  };

  return (
    <div
      className="
        absolute right-2 top-2 z-20 sm:right-3 sm:top-3
        opacity-100 scale-100
        sm:opacity-0 sm:scale-95
        transition-all duration-300 ease-out
        sm:group-hover:opacity-100 sm:group-hover:scale-100
      "
    >
      <button
        type="button"
        aria-label="Save to My Videos and Playlist"
        onClick={handleClick}
        className="rounded-full p-1.5 text-white bg-black/50 hover:bg-black/70 transform transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      >
        <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
      </button>
    </div>
  );
};

export default PlusButton;

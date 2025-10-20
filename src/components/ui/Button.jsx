export const Button = ({
    children,
    variant = "default",
    className = "",
    ...props
}) => {
    const base =
        "px-4 py-2 w-16 rounded-xl font-medium border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";

    const variants = {
        default:
            "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 hover:border-blue-700 focus:ring-blue-300",
        destructive:
            "bg-white text-red-600 border-red-500 hover:bg-red-50 hover:border-red-600 focus:ring-red-300",
        secondary:
            "bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:ring-gray-300",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

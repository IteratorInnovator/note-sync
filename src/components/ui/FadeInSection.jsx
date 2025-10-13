import React, { useEffect, useRef, useState } from "react";

const FadeInSection = ({
    children,
    direction = "up",
    threshold = 0.2,
    className = "",
    hiddenClassName,
    visibleClassName,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const element = sectionRef.current;
        if (!element) {
            return;
        }

        if (typeof window !== "undefined" && !("IntersectionObserver" in window)) {
            setIsVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    setIsVisible(entry.isIntersecting);
                });
            },
            { threshold }
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [threshold]);

    const directionClasses = {
        up: {
            hidden: "opacity-0 translate-y-4",
            visible: "opacity-100 translate-y-0",
        },
        left: {
            hidden: "opacity-0 -translate-x-6",
            visible: "opacity-100 translate-x-0",
        },
        right: {
            hidden: "opacity-0 translate-x-6",
            visible: "opacity-100 translate-x-0",
        },
    };

    const { hidden, visible } = directionClasses[direction] ?? directionClasses.up;
    const hiddenClasses = hiddenClassName ?? hidden;
    const visibleClasses = visibleClassName ?? visible;

    return (
        <div
            ref={sectionRef}
            className={`transition-all duration-700 ease-out transform ${isVisible ? visibleClasses : hiddenClasses} ${className}`}
        >
            {children}
        </div>
    );
};

export default FadeInSection;

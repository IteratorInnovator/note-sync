import React, { useState, useEffect, useRef } from "react";


const FeatureCard = ({ feature, onClick }) => {
    const Icon = feature.icon;
    const [isHovered, setIsHovered] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        observer.unobserve(entry.target);
                    }
                });
            },
            {
                threshold: 0.1,
                rootMargin: "50px"
            }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => {
            if (cardRef.current) {
                observer.unobserve(cardRef.current);
            }
        };
    }, []);

    return (
        <div
            ref={cardRef}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative cursor-pointer rounded-xl border border-gray-200 bg-white p-6 transition-all duration-700 hover:scale-[1.03] hover:shadow-xl hover:border-red-200 overflow-hidden ${
                isVisible 
                    ? 'opacity-100 translate-y-0 scale-100' 
                    : 'opacity-0 translate-y-12 scale-95'
            }`}
            style={{
                transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
        >
            {/* Animated background gradient on hover */}
            <div className={`absolute inset-0 bg-gradient-to-br from-red-50 to-transparent opacity-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : ''}`}></div>
            
            {/* Shimmer effect on hover */}
            <div className={`absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/30 to-transparent`}></div>

            <div className="relative flex flex-col items-center space-y-3 text-center">
                {/* Icon with scale and rotation animation */}
                <div 
                    className={`flex h-16 w-16 items-center justify-center rounded-full bg-red-50 transition-all duration-700 group-hover:bg-red-100 group-hover:scale-110 group-hover:rotate-6 ${isHovered ? 'shadow-lg' : ''} ${
                        isVisible ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-180'
                    }`}
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: '200ms'
                    }}
                >
                    <Icon className={`h-8 w-8 text-red-500 transition-all duration-500 ${isHovered ? 'scale-110' : ''}`} />
                </div>

                {/* Title with slide up animation */}
                <h3 
                    className={`text-lg font-semibold text-gray-900 transition-all duration-700 ${isHovered ? '-translate-y-0.5' : ''} ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: '300ms'
                    }}
                >
                    {feature.title}
                </h3>

                {/* Description with fade and slide */}
                <p 
                    className={`text-sm text-gray-600 transition-all duration-700 ${isHovered ? 'text-gray-700' : ''} ${
                        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                    }`}
                    style={{
                        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
                        transitionDelay: '400ms'
                    }}
                >
                    {feature.description}
                </p>

                {/* Demo media with zoom effect */}
                {feature.videoUrl && (
                    <div
                        className={`mt-2 w-full overflow-hidden rounded-lg transition-all duration-700 ${
                            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-90"
                        }`}
                        style={{
                            transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
                            transitionDelay: "500ms",
                        }}
                    >
                        <video
                            src={feature.videoUrl}
                            autoPlay
                            muted
                            loop
                            playsInline
                            className={`h-full w-full object-cover transition-transform duration-500 ${
                                isHovered ? "scale-110" : "scale-100"
                            }`}
                        />
                    </div>
                )}
            </div>

            {/* Corner accent that grows on hover */}
            <div className={`absolute top-0 right-0 w-0 h-0 border-t-0 border-r-0 transition-all duration-300 ${isHovered ? 'w-12 h-12 border-t-[3px] border-r-[3px] border-red-400' : ''}`}></div>
            <div className={`absolute bottom-0 left-0 w-0 h-0 border-b-0 border-l-0 transition-all duration-300 ${isHovered ? 'w-12 h-12 border-b-[3px] border-l-[3px] border-red-400' : ''}`}></div>
        </div>
    );
};

export default FeatureCard;
